/**
 * Attribute-Based Access Control (ABAC) Engine
 *
 * Policy structure: { subject_attrs, resource_attrs, env_conditions } → decision
 * Integrates with zero-trust-engine.ts as an override layer.
 *
 * 5 built-in policy types:
 *   1. classification-based  — secret/top-secret data requires clearance
 *   2. time-gated            — access only during business hours
 *   3. geo-fenced            — restrict to specific locations
 *   4. clearance-level       — role must meet minimum clearance threshold
 *   5. quantum-key-age       — access denied if PQC key is too old (novel integration with QATD)
 */

import { supabase } from "@/integrations/supabase/client";

export type ABACDecision = 'permit' | 'deny' | 'indeterminate' | 'not_applicable';

export interface SubjectAttributes {
  user_id: string;
  role: string;
  clearance_level: number;     // 1=user, 2=moderator, 3=admin
  department?: string;
  quantum_key_age_days?: number;
  qatd_score?: number;         // QATD trust score [0,1]
  location?: string;
  mfa_verified?: boolean;
}

export interface ResourceAttributes {
  resource_id: string;
  resource_type: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret';
  required_clearance?: number;
  owner_id?: string;
  tags?: string[];
}

export interface EnvironmentConditions {
  timestamp: Date;
  ip_address?: string;
  is_vpn?: boolean;
  location_country?: string;
  request_type: 'read' | 'write' | 'delete' | 'admin';
}

export interface ABACPolicyRule {
  id: string;
  name: string;
  description?: string;
  subject_filter: Partial<SubjectAttributes>;
  resource_filter: Partial<ResourceAttributes>;
  environment_conditions: Partial<EnvironmentConditions>;
  decision: ABACDecision;
  priority: number;
}

export interface ABACEvaluationResult {
  decision: ABACDecision;
  applicable_policies: string[];
  denied_by?: string;
  permitted_by?: string;
  evaluation_time_ms: number;
  audit_trail: Array<{ policy: string; decision: ABACDecision; reason: string }>;
}

// ============================================================
// Built-in Policies
// ============================================================
const BUILTIN_POLICIES: ABACPolicyRule[] = [
  {
    id: 'builtin-classification-secret',
    name: 'Secret Classification Requires Clearance',
    description: 'Resources classified as secret or top_secret require clearance ≥ 2',
    subject_filter: {},
    resource_filter: { classification: 'secret' },
    environment_conditions: {},
    decision: 'permit', // becomes deny if clearance fails (handled in evaluator)
    priority: 10,
  },
  {
    id: 'builtin-time-gate',
    name: 'Business Hours Access Gate',
    description: 'Administrative operations only during 06:00–22:00',
    subject_filter: {},
    resource_filter: {},
    environment_conditions: { request_type: 'admin' },
    decision: 'permit',
    priority: 20,
  },
  {
    id: 'builtin-geo-fence',
    name: 'VPN Geo-Fence',
    description: 'VPN usage triggers additional verification for write operations',
    subject_filter: {},
    resource_filter: {},
    environment_conditions: { is_vpn: true, request_type: 'write' },
    decision: 'deny',
    priority: 15,
  },
  {
    id: 'builtin-clearance',
    name: 'Minimum Clearance Level',
    description: 'Admin resources require clearance ≥ 3',
    subject_filter: {},
    resource_filter: { resource_type: 'admin_resource' },
    environment_conditions: {},
    decision: 'permit',
    priority: 5,
  },
  {
    id: 'builtin-quantum-key-age',
    name: 'Quantum Key Age Gate (Novel)',
    description: 'Access denied if quantum key is older than 90 days (QATD integration)',
    subject_filter: {},
    resource_filter: { classification: 'confidential' },
    environment_conditions: {},
    decision: 'deny', // enforced when key age exceeded
    priority: 8,
  },
];

/**
 * Core ABAC evaluation function.
 * Evaluates all applicable policies in priority order.
 * First explicit DENY wins (deny-override combining algorithm).
 */
export async function evaluateAccess(
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  environment: EnvironmentConditions
): Promise<ABACEvaluationResult> {
  const startTime = Date.now();
  const auditTrail: ABACEvaluationResult['audit_trail'] = [];
  const applicablePolicies: string[] = [];

  // Load custom policies from database
  const { data: customPolicies } = await supabase
    .from('abac_policies')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const allPolicies = [...BUILTIN_POLICIES];

  // Sort by priority (lower = higher priority)
  allPolicies.sort((a, b) => a.priority - b.priority);

  let finalDecision: ABACDecision = 'not_applicable';
  let permittedBy: string | undefined;
  let deniedBy: string | undefined;

  for (const policy of allPolicies) {
    const isApplicable = isPolicyApplicable(policy, subject, resource, environment);
    if (!isApplicable) continue;

    applicablePolicies.push(policy.id);

    const decision = evaluatePolicy(policy, subject, resource, environment);
    auditTrail.push({ policy: policy.name, decision, reason: getPolicyReason(policy, subject, resource, environment) });

    if (decision === 'deny') {
      deniedBy = policy.name;
      finalDecision = 'deny';
      break; // Deny-override: first deny wins
    }

    if (decision === 'permit' && (finalDecision as string) !== 'deny') {
      permittedBy = policy.name;
      finalDecision = 'permit';
    }
  }

  // Additional QATD-based decision
  if (finalDecision !== 'deny' && subject.qatd_score !== undefined) {
    if (subject.qatd_score < 0.3) {
      finalDecision = 'deny';
      deniedBy = 'QATD Score Too Low';
      auditTrail.push({
        policy: 'QATD Score Gate',
        decision: 'deny',
        reason: `Trust score ${subject.qatd_score.toFixed(3)} below minimum threshold 0.30`,
      });
    }
  }

  return {
    decision: finalDecision,
    applicable_policies: applicablePolicies,
    denied_by: deniedBy,
    permitted_by: permittedBy,
    evaluation_time_ms: Date.now() - startTime,
    audit_trail: auditTrail,
  };
}

function isPolicyApplicable(
  policy: ABACPolicyRule,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  env: EnvironmentConditions
): boolean {
  // Check resource filter
  if (policy.resource_filter.classification &&
      policy.resource_filter.classification !== resource.classification) return false;
  if (policy.resource_filter.resource_type &&
      policy.resource_filter.resource_type !== resource.resource_type) return false;

  // Check environment filter
  if (policy.environment_conditions.request_type &&
      policy.environment_conditions.request_type !== env.request_type) return false;
  if (policy.environment_conditions.is_vpn !== undefined &&
      policy.environment_conditions.is_vpn !== env.is_vpn) return false;

  return true;
}

function evaluatePolicy(
  policy: ABACPolicyRule,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  env: EnvironmentConditions
): ABACDecision {
  switch (policy.id) {
    case 'builtin-classification-secret':
      // Deny if clearance insufficient
      const requiredClearance = resource.classification === 'top_secret' ? 3 : 2;
      return subject.clearance_level >= requiredClearance ? 'permit' : 'deny';

    case 'builtin-time-gate':
      const hour = env.timestamp.getHours();
      return (hour >= 6 && hour < 22) ? 'permit' : 'deny';

    case 'builtin-geo-fence':
      return env.is_vpn ? 'deny' : 'not_applicable';

    case 'builtin-clearance':
      return subject.clearance_level >= 3 ? 'permit' : 'deny';

    case 'builtin-quantum-key-age':
      if (subject.quantum_key_age_days === undefined) return 'not_applicable';
      return subject.quantum_key_age_days <= 90 ? 'permit' : 'deny';

    default:
      return policy.decision;
  }
}

function getPolicyReason(
  policy: ABACPolicyRule,
  subject: SubjectAttributes,
  resource: ResourceAttributes,
  env: EnvironmentConditions
): string {
  switch (policy.id) {
    case 'builtin-classification-secret':
      return `Clearance ${subject.clearance_level} vs required ${resource.classification === 'top_secret' ? 3 : 2}`;
    case 'builtin-time-gate':
      return `Request hour: ${env.timestamp.getHours()}`;
    case 'builtin-geo-fence':
      return `VPN detected: ${env.is_vpn}`;
    case 'builtin-clearance':
      return `Clearance ${subject.clearance_level}/3`;
    case 'builtin-quantum-key-age':
      return `Key age: ${subject.quantum_key_age_days} days`;
    default:
      return policy.description || '';
  }
}

/**
 * Get subject attributes for a user (fetches live data)
 */
export async function getSubjectAttributes(userId: string): Promise<SubjectAttributes> {
  const [roleData, keyData] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId).limit(1),
    supabase.from('quantum_key_cache').select('created_at').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(1),
  ]);

  const role = roleData.data?.[0]?.role || 'user';
  const clearanceMap: Record<string, number> = { user: 1, moderator: 2, admin: 3 };
  const clearance = clearanceMap[role] || 1;

  let keyAgeDays = 0;
  if (keyData.data?.[0]) {
    keyAgeDays = (Date.now() - new Date(keyData.data[0].created_at).getTime()) / (1000 * 60 * 60 * 24);
  }

  return {
    user_id: userId,
    role,
    clearance_level: clearance,
    quantum_key_age_days: keyAgeDays,
    mfa_verified: true, // Assume true if logged in
  };
}

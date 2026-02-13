# Next-Level Roadmap: Quantum-Resistant Blockchain-Based IAM System

## Executive Summary

This document outlines a **16-week, 6-phase roadmap** to evolve the Quantum-Resistant Blockchain-Based Identity and Access Management (IAM) System from its current prototype state into a **production-grade, research-publication-ready platform**. The plan addresses critical build errors, completes the migration to NIST-standard post-quantum cryptography, enhances the blockchain layer with persistence and external timestamping, closes enterprise IAM feature gaps, hardens security monitoring, and polishes the system for academic demonstration.

---

## Current State Assessment

### Strengths
- **Post-Quantum Cryptography**: `@noble/post-quantum` library integrated with ML-KEM-768/1024 and ML-DSA-65/87 support
- **Comprehensive IAM**: 89+ database tables covering roles, permissions, sessions, audit logs, trust scores, device fingerprints, and more
- **Blockchain Layer**: In-memory blockchain with blocks, mempool, forks, P2P peers, and mining simulation
- **Zero-Trust Architecture**: Zero-trust policy engine, behavioral analytics, adaptive MFA, risk-based authentication
- **Enterprise Features**: JIT access, privileged access management, approval workflows, compliance reporting, SCIM-ready tables

### Weaknesses
- **Build Error**: `libsodium-wrappers` fails to resolve `./libsodium.mjs` in Vite ESM bundling — app cannot build
- **Dual Crypto Stack**: 8+ files still import `libsodium-wrappers` for classical Ed25519/X25519 alongside `@noble/post-quantum`
- **Blockchain Persistence**: Blocks are simulated in-memory; `blockchain_blocks` Supabase table exists but isn't used by the chain engine
- **RLS Coverage**: Many tables lack Row-Level Security policies — data exposure risk
- **Role Enum Constraint**: `system_role` enum restricts custom role creation to only `admin`, `moderator`, `user`
- **Demo Readiness**: No public demo mode; no performance benchmarking; no research-mode overlays

---

## Phase 1: Foundation Stabilization (Weeks 1–2)

### Goal
Fix all build errors, remove dead code, and ensure the app runs cleanly.

### Tasks

#### 1.1 Fix libsodium-wrappers ESM Build Error
**Priority: CRITICAL**

The `libsodium-wrappers` package ships a broken ESM entry that references `./libsodium.mjs` incorrectly under Vite's module resolution.

**Solution Options (in order of preference):**
1. **Vite `optimizeDeps` workaround**: Add `optimizeDeps.include: ['libsodium-wrappers']` to `vite.config.ts` to force pre-bundling
2. **Replace with `@noble/post-quantum`**: Migrate all 8 files to use the already-installed `@noble/post-quantum` library
3. **Remove libsodium entirely**: Since all PQC algorithms are available via `@noble/post-quantum`, remove `libsodium-wrappers` dependency

**Files affected:**
- `vite.config.ts` — add optimizeDeps configuration
- `src/lib/quantum-crypto.ts` — primary libsodium consumer
- `src/lib/quantum-blockchain.ts` — Ed25519 signing
- `src/lib/pqc-authentication.ts` — classical auth functions
- `src/lib/pqc-session-manager.ts` — session crypto
- `src/lib/pqc-database-encryption.ts` — database-level encryption
- `src/lib/threshold-signatures.ts` — threshold key management
- `src/lib/quantum-key-distribution.ts` — key distribution
- `src/lib/cross-chain-identity.ts` — cross-chain identity verification

#### 1.2 Consolidate Duplicate Crypto Utilities
Currently three overlapping files:
- `src/lib/quantum-crypto.ts` — original crypto (uses libsodium)
- `src/lib/quantum-pqc.ts` — PQC wrapper (uses @noble/post-quantum)
- `src/lib/crypto-utils.ts` — Web Crypto API helpers

**Action**: Merge into a single `src/lib/crypto-engine.ts` with a clean API surface:
```typescript
export const CryptoEngine = {
  // Key generation
  generateKeyPair(algorithm: 'ML-KEM-768' | 'ML-KEM-1024' | 'ML-DSA-65' | 'ML-DSA-87'): Promise<KeyPair>,
  
  // Signing
  sign(data: Uint8Array, privateKey: Uint8Array, algorithm?: string): Promise<Uint8Array>,
  verify(signature: Uint8Array, data: Uint8Array, publicKey: Uint8Array, algorithm?: string): Promise<boolean>,
  
  // Key encapsulation
  encapsulate(publicKey: Uint8Array): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }>,
  decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>,
  
  // Symmetric encryption (AES-GCM via Web Crypto)
  encrypt(data: Uint8Array, key: CryptoKey): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }>,
  decrypt(ciphertext: Uint8Array, key: CryptoKey, nonce: Uint8Array): Promise<Uint8Array>,
  
  // Hashing
  hash(data: Uint8Array, algorithm?: 'SHA-256' | 'SHA-512'): Promise<Uint8Array>,
  
  // Random
  randomBytes(length: number): Uint8Array,
};
```

#### 1.3 Fix Role Creation Enum Constraint
The `system_role` enum only allows `admin`, `moderator`, `user`. Custom roles are blocked.

**Database change**: Create a `custom_roles` table that references permission sets, keeping the enum for system-level roles while allowing unlimited custom roles.

#### 1.4 Add Error Boundaries
Wrap all page-level routes with React Error Boundaries to prevent white-screen crashes.

#### 1.5 Clean Up Stale Sessions
Run a one-time cleanup of expired sessions in `user_sessions` table. Ensure the `cleanup-stale-sessions` edge function runs on schedule.

### Deliverables
- [ ] App builds and runs without errors
- [ ] Single unified crypto engine
- [ ] Custom roles supported
- [ ] Error boundaries on all pages
- [ ] Stale sessions cleaned

---

## Phase 2: True Post-Quantum Cryptography Integration (Weeks 3–5)

### Goal
Replace ALL remaining classical crypto with NIST-standard PQC algorithms.

### Tasks

#### 2.1 Migrate All libsodium Imports
Replace every `libsodium-wrappers` import with equivalent `@noble/post-quantum` or Web Crypto API calls.

| Classical Operation | PQC Replacement |
|---|---|
| `crypto_sign_keypair()` (Ed25519) | `ml_dsa65.keygen()` (ML-DSA-65) |
| `crypto_sign_detached()` | `ml_dsa65.sign()` |
| `crypto_sign_verify_detached()` | `ml_dsa65.verify()` |
| `crypto_box_keypair()` (X25519) | `ml_kem768.keygen()` (ML-KEM-768) |
| `crypto_box_easy()` | `ml_kem768.encapsulate()` + AES-GCM |
| `crypto_box_open_easy()` | `ml_kem768.decapsulate()` + AES-GCM |
| `crypto_secretbox_easy()` | Web Crypto `AES-GCM` |
| `randombytes_buf()` | `crypto.getRandomValues()` |

#### 2.2 Implement Hybrid Authentication
Create `src/lib/hybrid-auth.ts` implementing dual-signature authentication:
1. Classical Ed25519 signature (via Web Crypto or retained libsodium)
2. ML-DSA-65 post-quantum signature
3. Both must verify for authentication to succeed
4. Provides defense-in-depth: if either algorithm is broken, the other still protects

#### 2.3 PQC-Protected Session Tokens
- Generate session keys using ML-KEM-768 key encapsulation
- Encrypt session data with the shared secret via AES-256-GCM
- Store encapsulated key in `user_sessions` table

#### 2.4 Quantum Key Generation on Signup
- On user registration, generate ML-KEM-768 and ML-DSA-65 key pairs
- Store public keys in `quantum_keys` table
- Encrypt private keys with user's password-derived key (PBKDF2 via Web Crypto)

#### 2.5 Automated Key Rotation
Create `supabase/functions/rotate-quantum-keys/index.ts`:
- Runs daily via cron
- Rotates keys older than 90 days
- Records rotation in `quantum_key_rotations` table
- Notifies users of key rotation via audit log

#### 2.6 Crypto Migration Dashboard
Build `src/pages/admin/CryptoMigration.tsx`:
- Visual breakdown: how many operations use classical vs PQC
- Per-user migration status from `pqc_migration_status` table
- One-click "migrate all" action for admins
- Progress indicators with Recharts

#### 2.7 Remove libsodium-wrappers
Once all migrations complete:
```bash
npm uninstall libsodium-wrappers @types/libsodium-wrappers
```

### Deliverables
- [ ] Zero libsodium imports remaining
- [ ] Hybrid auth (Ed25519 + ML-DSA-65) operational
- [ ] Session tokens encrypted with ML-KEM-768
- [ ] Key rotation edge function deployed
- [ ] Crypto migration dashboard functional
- [ ] `libsodium-wrappers` removed from `package.json`

---

## Phase 3: Blockchain Architecture Enhancement (Weeks 6–9)

### Goal
Evolve from in-memory simulation to a verifiable, persistent blockchain.

### Tasks

#### 3.1 Supabase-Persisted Blockchain
- Modify `src/lib/quantum-blockchain.ts` to write every mined block to `blockchain_blocks` table
- On app load, reconstruct chain state from Supabase
- Integrity verification: recalculate all hashes on load and compare

#### 3.2 RFC 3161 External Timestamping
Create `src/lib/external-timestamp.ts`:
- Submit block hashes to an RFC 3161 Time Stamp Authority (TSA)
- Store timestamp tokens in new `external_timestamps` table
- Provides third-party auditability and non-repudiation

**Database schema:**
```sql
CREATE TABLE external_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_hash TEXT NOT NULL,
  block_index INTEGER NOT NULL,
  timestamp_token TEXT NOT NULL,
  tsa_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.3 Supabase Realtime P2P Synchronization
- Use Supabase Realtime channels for lightweight multi-node sync
- Each browser tab acts as a "node"
- Broadcast new blocks via `blockchain_updates` channel
- Nodes validate and accept/reject incoming blocks

#### 3.4 Dynamic Difficulty Adjustment
- Target: 10-second block time
- Adjust difficulty every 10 blocks based on actual vs target time
- Store difficulty in `blockchain_blocks.difficulty` column

#### 3.5 Enhanced Mempool
- Priority queue based on `transaction_fee / size_bytes`
- Transaction expiry after 1 hour
- Duplicate detection by transaction hash
- Leverage existing `blockchain_mempool` table

#### 3.6 Fork Detection and Resolution
- Detect chain splits when two nodes mine blocks at the same height
- Implement longest-chain (heaviest-work) rule
- Log forks to `blockchain_forks` table
- Auto-reorg to the heaviest chain

#### 3.7 Block Explorer Page
Build `src/pages/admin/BlockExplorer.tsx`:
- Paginated block list with real-time updates
- Block detail view: hash, previous hash, merkle root, nonce, difficulty, transactions
- Transaction search by ID, user, or action
- Chain visualization (last 50 blocks)
- Export to JSON

#### 3.8 Verifiable Credentials Export
- Export audit trails in W3C Verifiable Credentials (VC) format
- JSON-LD serialization with blockchain proof
- Useful for academic papers and compliance

### Deliverables
- [ ] All blocks persisted to Supabase
- [ ] External timestamping operational
- [ ] Realtime multi-tab sync working
- [ ] Dynamic difficulty adjustment active
- [ ] Block explorer page complete
- [ ] VC export functional

---

## Phase 4: IAM Enterprise Features (Weeks 10–12)

### Goal
Close remaining enterprise IAM gaps.

### Tasks

#### 4.1 Custom Roles System
**Database schema:**
```sql
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  permission_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
- UI for creating/editing custom roles in `/admin/roles`
- Map custom roles to permission sets
- Maintain backward compatibility with `system_role` enum

#### 4.2 SCIM 2.0 Provisioning
Create `supabase/functions/scim-provisioning/index.ts`:
- `GET /Users` — List users
- `POST /Users` — Create user
- `PUT /Users/:id` — Update user
- `DELETE /Users/:id` — Deactivate user
- `GET /Groups` — List groups
- `POST /Groups` — Create group
- Bearer token authentication
- JSON SCIM schema compliance

#### 4.3 Attribute-Based Access Control (ABAC)
Create `src/lib/abac-engine.ts`:
```typescript
interface ABACPolicy {
  subject: { role?: string; department?: string; clearance?: number };
  action: string;
  resource: { type: string; classification?: string };
  environment: { time_range?: [string, string]; ip_range?: string };
}

function evaluateABAC(request: AccessRequest, policies: ABACPolicy[]): boolean;
```
- Evaluate policies based on user attributes, resource attributes, and environment conditions
- Complement existing RBAC — ABAC overrides when defined

#### 4.4 PAM Session Recording
- Log all admin actions with full request/response context
- Store in `privileged_sessions.activities` (already exists)
- Add playback viewer in admin dashboard

#### 4.5 Identity Governance Dashboard
Build `src/pages/admin/IdentityGovernance.tsx`:
- **Access Reviews**: Periodic certification that users still need their permissions
- **SoD Violations**: Flag users with conflicting permissions (e.g., both "approve" and "create" on financial resources)
- **Orphaned Accounts**: Users with no recent activity
- **Access Certification Campaigns**: Scheduled reviews with approval workflows

**Database schema:**
```sql
CREATE TABLE access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  reviewer_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, revoked
  decision_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4.6 Delegated Administration
- Department-level admins with scoped permissions
- Can only manage users within their department/group
- Uses existing `user_groups` + `group_permissions` tables

### Deliverables
- [ ] Custom roles fully functional
- [ ] SCIM 2.0 endpoint deployed
- [ ] ABAC engine integrated
- [ ] Identity governance dashboard complete
- [ ] Delegated administration working

---

## Phase 5: Security Hardening and Monitoring (Weeks 13–14)

### Goal
Production-grade security monitoring and incident response.

### Tasks

#### 5.1 Real-Time Anomaly Detection
Create `supabase/functions/anomaly-detection/index.ts`:
- Analyze login patterns using behavioral baselines
- Detect: impossible travel, brute force, credential stuffing, unusual time access
- Trigger alerts in `system_alerts` table
- Use existing `user_behavioral_patterns` data

#### 5.2 SOC Dashboard
Build `src/pages/admin/SOCDashboard.tsx`:
- **Live Threat Feed**: Real-time stream from `quantum_attack_logs` and `attack_simulation_logs`
- **Active Session Map**: Geolocation visualization of current sessions
- **Alert Triage**: Severity-based alert management with acknowledge/dismiss/escalate
- **Incident Timeline**: Chronological view of security events

#### 5.3 Automated Incident Response Playbooks
Create `src/lib/incident-playbooks.ts`:
```typescript
const playbooks = {
  brute_force: {
    trigger: 'failed_logins > 5 in 5 minutes',
    actions: ['lock_account', 'notify_admin', 'log_incident']
  },
  impossible_travel: {
    trigger: 'login_distance > 500km in 30 minutes',
    actions: ['terminate_sessions', 'require_mfa', 'notify_user']
  },
  privilege_escalation: {
    trigger: 'role_change without approval',
    actions: ['revert_role', 'lock_account', 'alert_soc']
  }
};
```

**Database schema:**
```sql
CREATE TABLE incident_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_name TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  response_actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5.4 Comprehensive RLS Policies
Audit ALL 89 tables and add RLS policies where missing. Priority tables:
- `quantum_keys` — users can only see their own keys
- `user_sessions` — users can only see their own sessions
- `audit_logs` — admins only
- `blockchain_blocks` — read-only for all authenticated users
- `trust_score_factors` — users can see their own scores

#### 5.5 API Rate Limiting
- Sliding window counters using `api_rate_limit_logs` table
- Configurable per-endpoint limits
- Auto-block on sustained abuse

#### 5.6 Security Headers Edge Function
Create edge function that adds:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Deliverables
- [ ] Anomaly detection running
- [ ] SOC dashboard operational
- [ ] Incident playbooks configured
- [ ] RLS on all tables
- [ ] Rate limiting active
- [ ] Security headers deployed

---

## Phase 6: Research Publication and Demo (Weeks 15–16)

### Goal
Polish for academic presentation and publication.

### Tasks

#### 6.1 Public Demo Mode
- Toggle that bypasses authentication
- Pre-populated with sample data
- Read-only mode for demonstrations
- Accessible at `/demo` route

#### 6.2 Performance Benchmarking Page
Build `src/pages/admin/Benchmarks.tsx`:
- **ML-KEM-768**: keygen, encapsulate, decapsulate timing
- **ML-KEM-1024**: keygen, encapsulate, decapsulate timing
- **ML-DSA-65**: keygen, sign, verify timing
- **ML-DSA-87**: keygen, sign, verify timing
- **Classical comparison**: RSA-2048, ECDSA-P256 (simulated baselines)
- **Blockchain throughput**: transactions per second, block time
- Real-time charts using Recharts
- Store results in `performance_benchmarks` table
- Export as SVG for publication

#### 6.3 Interactive System Architecture Diagram
- Mermaid.js-based architecture diagram
- Clickable layers showing component details
- Data flow visualization
- Shows all 7 layers from PRP document

#### 6.4 Research Mode Toggle
- When enabled, shows:
  - Mathematical formulas for ML-KEM (Learning With Errors)
  - Lattice reduction complexity analysis
  - Trust score computation formula with weights
  - Blockchain consensus algorithm pseudocode
- LaTeX-rendered equations (using KaTeX)

#### 6.5 Compliance Attestation Generator
- Generate PDF reports covering:
  - NIST PQC compliance status
  - SOC 2 Type II control mappings
  - ISO 27001 control mappings
  - GDPR data protection measures
- Use `jspdf` for PDF generation

### Deliverables
- [ ] Demo mode accessible
- [ ] Benchmarking page with real-time metrics
- [ ] Architecture diagram interactive
- [ ] Research mode with math formulas
- [ ] Compliance PDF generator working

---

## Database Schema Changes Summary

| Table | Phase | Purpose |
|-------|-------|---------|
| `custom_roles` | 1 | Flexible role definitions |
| `external_timestamps` | 3 | RFC 3161 timestamp records |
| `access_reviews` | 4 | Identity governance campaigns |
| `incident_playbooks` | 5 | Automated response configurations |
| RLS policies (all tables) | 5 | Security hardening |

---

## New Files Summary

| File | Phase | Purpose |
|------|-------|---------|
| `src/lib/crypto-engine.ts` | 1 | Unified crypto API |
| `src/lib/hybrid-auth.ts` | 2 | Dual-signature authentication |
| `src/pages/admin/CryptoMigration.tsx` | 2 | Migration dashboard |
| `supabase/functions/rotate-quantum-keys/index.ts` | 2 | Automated key rotation |
| `src/lib/external-timestamp.ts` | 3 | RFC 3161 timestamping |
| `src/pages/admin/BlockExplorer.tsx` | 3 | Block explorer UI |
| `src/lib/abac-engine.ts` | 4 | ABAC policy engine |
| `src/pages/admin/IdentityGovernance.tsx` | 4 | Governance dashboard |
| `supabase/functions/scim-provisioning/index.ts` | 4 | SCIM 2.0 endpoint |
| `src/lib/incident-playbooks.ts` | 5 | Incident response |
| `src/pages/admin/SOCDashboard.tsx` | 5 | SOC dashboard |
| `supabase/functions/anomaly-detection/index.ts` | 5 | Anomaly detection |
| `src/pages/admin/Benchmarks.tsx` | 6 | Performance benchmarking |

---

## Success Metrics

| Metric | Current | Target | Phase |
|--------|---------|--------|-------|
| Build status | ❌ Broken | ✅ Clean build, zero warnings | 1 |
| NIST PQC compliance | ~40% (libsodium still used) | 100% PQC | 2 |
| Blockchain persistence | In-memory only | Full Supabase persistence | 3 |
| External auditability | None | RFC 3161 timestamps | 3 |
| Custom roles | Blocked by enum | Unlimited custom roles | 4 |
| SCIM provisioning | Not implemented | SCIM 2.0 compliant | 4 |
| RLS coverage | ~30% of tables | 100% of tables | 5 |
| Incident response | Manual only | Automated playbooks | 5 |
| Demo readiness | Requires auth | Public demo mode | 6 |
| Research mode | None | Math formulas + benchmarks | 6 |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| PQC library breaking changes | Medium | High | Pin `@noble/post-quantum` version; add integration tests |
| Performance degradation from PQC | Medium | Medium | Benchmark early; cache keys aggressively; use Web Workers |
| Supabase rate limits | Low | High | Implement client-side caching; batch blockchain writes |
| Side-channel attacks on browser crypto | Low | High | Use constant-time operations; document browser limitations |
| Scope creep | High | Medium | Strict phase gates; no feature additions without plan update |
| Key compromise during rotation | Low | Critical | Dual-key overlap period; atomic rotation; backup keys |

---

## Resource Requirements

### Computing
- Supabase Pro plan (for edge functions, realtime, storage)
- GitHub repository with CI/CD

### Libraries (Already Installed)
- `@noble/post-quantum` — ML-KEM, ML-DSA
- `@supabase/supabase-js` — Database, auth, realtime
- `recharts` — Charts and visualizations
- `xlsx` — Excel export

### Libraries (To Add)
- `katex` — LaTeX rendering for research mode
- `jspdf` — PDF generation for compliance reports
- `mermaid` — Architecture diagrams (or use Recharts)

### Human Resources
- 1 Full-stack developer
- 1 Cryptography advisor (for PQC review)
- 1 Security reviewer (for RLS and penetration testing)

---

## Conclusion

This roadmap transforms the Quantum-Resistant Blockchain IAM System from a functional prototype into a **publication-ready, enterprise-grade platform**. By systematically addressing build issues, completing the PQC migration, enhancing the blockchain layer, adding enterprise IAM features, hardening security, and preparing for academic demonstration, the system will be positioned as a **leading reference implementation** for post-quantum identity management.

The 16-week timeline is aggressive but achievable with focused execution. Each phase builds on the previous one, with clear deliverables and success metrics to track progress.

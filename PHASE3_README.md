# Phase 3: IAM Enhancements - JIT Access & Adaptive MFA

## Overview

Phase 3 extends the IAM framework with Just-In-Time (JIT) Access Control and Risk-Based Adaptive Multi-Factor Authentication (MFA).

## Features Implemented

### 1. Just-In-Time (JIT) Access Control

**Module:** `src/lib/jit-access-manager.ts`

- **Temporary Access:** Time-limited access to resources with automatic expiration
- **Risk-Based Approval:** Low-risk requests auto-approved, high-risk require manual approval
- **Access Policies:** Configurable policies per resource type and risk level
- **Automatic Expiration:** Sessions automatically expire after configured duration

**Risk Levels:**
- **Low:** Auto-approved, 24-hour duration
- **Medium:** Requires approval, 12-hour duration
- **High:** Requires admin approval, 4-hour duration
- **Critical:** Multi-approver workflow, 1-2 hour duration

### 2. Risk-Based Adaptive MFA

**Module:** `src/lib/adaptive-mfa.ts`

Calculates authentication requirements based on context:

**MFA Tiers:**
- **Low Risk:** No MFA required
- **Medium Risk:** SMS/Email OTP
- **High Risk:** Hardware token + Biometric
- **Critical Risk:** Multi-approver workflow

**Risk Factors Analyzed:**
- VPN/Proxy usage
- New device/location
- Failed login attempts
- Account age
- User trust score
- Time of access

## Database Tables

- `jit_access_sessions` - JIT access requests and sessions
- `jit_access_policies` - Access policies configuration
- `adaptive_mfa_events` - MFA authentication events
- `mfa_challenge_tokens` - MFA challenge tokens

## Integration

### Blockchain Audit Trail

All JIT access decisions and MFA events are logged to the quantum-secure blockchain from Phase 2:

```typescript
// Blockchain integration enabled by default
const jitManager = new JITAccessManager(true);
const mfaManager = new AdaptiveMFAManager(true);
```

### React Hooks

```typescript
import { useJITAccess } from '@/hooks/useJITAccess';
import { useAdaptiveMFA } from '@/hooks/useAdaptiveMFA';
```

### Admin Dashboard

Access via: `src/components/admin/Phase3Dashboard.tsx`

## Usage Examples

### Request JIT Access

```typescript
const { requestAccess } = useJITAccess();

await requestAccess({
  userId: user.id,
  resourceType: 'documents',
  resourceId: 'doc-123',
  accessLevel: 'read',
  duration: 4, // hours
  reason: 'Need to review quarterly reports'
});
```

### Adaptive MFA Assessment

```typescript
const { assessRisk } = useAdaptiveMFA();

const assessment = await assessRisk({
  userId: user.id,
  ipAddress: '192.168.1.1',
  deviceFingerprint: 'xyz',
  isNewDevice: true,
  trustScore: 65
});

// assessment.requiredMFALevel: 'basic' | 'enhanced' | 'critical'
// assessment.recommendedMFAMethods: ['sms', 'email', 'totp']
```

## Security Features

- ✅ All access decisions logged to immutable blockchain
- ✅ Automatic session expiration
- ✅ Risk-based approval workflows
- ✅ Multi-factor authentication challenges
- ✅ Comprehensive audit trail
- ✅ RLS policies on all tables

## Testing

Run JIT access flow:
1. Request access to a resource
2. Check risk level calculation
3. Approve/deny based on policy
4. Verify blockchain audit log

Test Adaptive MFA:
1. Simulate different risk contexts
2. Verify correct MFA level assignment
3. Create and verify MFA challenges
4. Check event logging

## Next Steps

Phase 4 would include:
- Advanced ML-based risk scoring
- Integration with external threat intelligence
- Automated policy recommendations
- Real-time session monitoring

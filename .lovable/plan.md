

# Comprehensive Plan: Taking the Quantum-Resistant Blockchain IAM System to the Next Level

## 1. Immediate Fix: Build Error

The project currently has a build error caused by `libsodium-wrappers` failing to resolve `./libsodium.mjs`. This must be fixed first by adding a Vite configuration workaround or replacing libsodium usage with the already-installed `@noble/post-quantum` library where possible.

**Action:** Update `vite.config.ts` to add an optimizeDeps configuration for libsodium-wrappers, and ensure proper ESM resolution.

---

## 2. The New Plan Document (`new_plan.md`)

A comprehensive markdown file will be created covering 6 strategic phases across 16 weeks. Here is the full structure:

---

### Phase 1: Foundation Stabilization (Weeks 1-2)

**Goal:** Fix all build errors, remove dead code, and ensure the app runs cleanly.

- Fix the `libsodium-wrappers` ESM build error
- Audit and remove unused dependencies
- Consolidate duplicate crypto utilities (currently `quantum-crypto.ts`, `quantum-pqc.ts`, `crypto-utils.ts` all overlap)
- Fix the role creation enum constraint (allow custom roles via a separate table instead of enum)
- Clean up stale session records in the database
- Add proper error boundaries to all pages

### Phase 2: True Post-Quantum Cryptography Integration (Weeks 3-5)

**Goal:** Replace all remaining classical crypto (libsodium/Ed25519) with true NIST PQC algorithms.

The project already uses `@noble/post-quantum` for ML-KEM and ML-DSA. However, 8+ files still import `libsodium-wrappers` for classical crypto.

- Migrate all `libsodium-wrappers` imports to use `@noble/post-quantum` or Web Crypto API
- Implement hybrid authentication flow: Ed25519 (classical) + ML-DSA-65 (post-quantum) dual signatures on every auth event
- Add PQC-protected session tokens with ML-KEM key encapsulation
- Integrate quantum key generation into user signup flow
- Implement automated PQC key rotation via edge function (cron-based)
- Build a "Crypto Migration Dashboard" showing classical vs PQC usage across the system
- Remove `libsodium-wrappers` dependency entirely once migration is complete

### Phase 3: Blockchain Architecture Enhancement (Weeks 6-9)

**Goal:** Evolve from single-node in-memory simulation to a verifiable, persistent blockchain with external timestamping.

- Persist all blockchain blocks to Supabase `blockchain_blocks` table with integrity checks
- Add RFC 3161 external timestamping for third-party auditability
- Implement Supabase Realtime-based multi-node synchronization (lightweight P2P using Supabase channels)
- Add dynamic difficulty adjustment (target 10-second block time)
- Build a proper mempool with transaction priority queue
- Implement fork detection and longest-chain resolution
- Add a block explorer page (`/admin/block-explorer`) with search, filtering, and transaction drill-down
- Create exportable audit trails in JSON-LD / W3C Verifiable Credentials format

### Phase 4: IAM Enterprise Features (Weeks 10-12)

**Goal:** Close remaining enterprise IAM gaps.

- Custom role creation: Replace the `system_role` enum with a flexible `custom_roles` table that maps to permission sets
- Implement SCIM 2.0 provisioning endpoint (edge function) for automated user lifecycle from external IdPs
- Add Attribute-Based Access Control (ABAC) alongside existing RBAC, with policy evaluation engine
- Implement Privileged Access Management (PAM) session recording (audit log of all admin actions with full context)
- Add Just-In-Time (JIT) elevated access with automatic expiration and approval workflows
- Build a unified Identity Governance dashboard showing access reviews, certification campaigns, and SoD (Separation of Duties) violations
- Implement delegated administration (department-level admins with scoped permissions)

### Phase 5: Security Hardening and Monitoring (Weeks 13-14)

**Goal:** Production-grade security monitoring and incident response.

- Implement real-time anomaly detection edge function using behavioral baselines
- Add a Security Operations Center (SOC) dashboard with:
  - Live threat feed
  - Active session map (geolocation visualization)
  - Alert severity triage
  - Incident timeline view
- Build automated incident response playbooks (auto-lock account on brute force, auto-revoke on impossible travel)
- Add comprehensive Row-Level Security (RLS) policies to ALL tables (currently many tables lack RLS)
- Implement API rate limiting with sliding window counters
- Add Content Security Policy headers and security headers edge function
- Create a penetration testing simulation mode with documented attack scenarios

### Phase 6: Research Publication and Demo (Weeks 15-16)

**Goal:** Polish for academic presentation and publication.

- Build a public-facing demo mode that showcases all features without requiring authentication
- Add performance benchmarking page showing real-time crypto operation metrics:
  - ML-KEM-768 keygen, encapsulate, decapsulate times
  - ML-DSA-65 keygen, sign, verify times
  - Classical vs PQC comparison charts
  - Blockchain throughput metrics
- Generate publication-ready figures (SVG export from Recharts)
- Create an interactive system architecture diagram page
- Add a "Research Mode" toggle that shows mathematical formulas and algorithm details alongside each feature
- Build a compliance attestation generator that produces a PDF report

---

## 3. Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `new_plan.md` | The comprehensive plan document |
| `src/pages/admin/BlockExplorer.tsx` | Block explorer with search and drill-down |
| `src/pages/admin/SOCDashboard.tsx` | Security Operations Center dashboard |
| `src/pages/admin/IdentityGovernance.tsx` | Access reviews and governance |
| `src/pages/admin/CryptoMigration.tsx` | Classical-to-PQC migration dashboard |
| `src/pages/admin/Benchmarks.tsx` | Real-time performance benchmarking |
| `src/lib/hybrid-auth.ts` | Hybrid classical+PQC authentication |
| `src/lib/external-timestamp.ts` | RFC 3161 timestamping integration |
| `src/lib/abac-engine.ts` | Attribute-Based Access Control engine |
| `src/lib/incident-playbooks.ts` | Automated incident response |
| `supabase/functions/scim-provisioning/index.ts` | SCIM 2.0 endpoint |
| `supabase/functions/rotate-quantum-keys/index.ts` | Automated key rotation cron |
| `supabase/functions/anomaly-detection/index.ts` | Real-time anomaly detection |

### Database Changes Needed
- New `custom_roles` table (replacing enum constraint)
- New `access_reviews` table for identity governance
- New `incident_playbooks` table for automated response
- New `external_timestamps` table for RFC 3161 records
- Add RLS policies to all existing tables missing them
- New `performance_benchmarks` table for storing benchmark results

### Build Error Fix
- Update `vite.config.ts` to add `optimizeDeps.include: ['libsodium-wrappers']` or add a Rollup alias
- Alternatively, migrate all 8 files using libsodium to `@noble/post-quantum` + Web Crypto API

---

## 4. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| NIST PQC compliance | Partial (noble/post-quantum exists but libsodium still used) | 100% PQC across all crypto operations |
| Blockchain persistence | In-memory only | Full Supabase persistence + external timestamps |
| RLS coverage | Partial | 100% of tables |
| Custom roles | Blocked by enum | Fully flexible custom roles |
| Demo readiness | Functional but rough | Publication-quality interactive demo |
| Build status | Broken (libsodium ESM error) | Clean build, zero warnings |

---

## 5. Implementation Approach

The `new_plan.md` file will contain all of the above in a well-structured markdown document with:
- Executive summary
- Current state assessment (honest)
- 6-phase roadmap with weekly breakdown
- Technical specifications for each feature
- Database schema changes
- Success metrics and KPIs
- Risk assessment
- Resource requirements


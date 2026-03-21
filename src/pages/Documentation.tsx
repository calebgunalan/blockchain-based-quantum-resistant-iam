import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Cryptographic Algorithms",
    items: [
      { name: "ML-KEM-1024 (FIPS 203)", desc: "Lattice-based key encapsulation mechanism. Provides 256-bit security against quantum adversaries. Used for session key establishment and encrypted credential exchange." },
      { name: "ML-DSA-87 (FIPS 204)", desc: "Module-lattice digital signature algorithm. Used in hybrid mode (ECDSA P-256 + ML-DSA-65) for all authentication events and blockchain block signing." },
      { name: "SHA-3-256", desc: "Keccak-based hash function used for blockchain block hashing, merkle root computation, and integrity verification. Provides 128-bit quantum security." },
      { name: "ECDSA P-256", desc: "Classical elliptic curve signatures via Web Crypto API. Used as the classical half of hybrid authentication for backwards compatibility." },
    ],
  },
  {
    title: "Novel Algorithm Specifications",
    items: [
      { name: "QATD — Quantum-Adaptive Trust Decay", desc: "T(t) = T_base × e^(-λ_b × Δbehavior) × e^(-λ_k × key_age/90) × C_blockchain. Combines behavioural entropy (λ_b = 0.15), PQC key age decay (λ_k = 0.08), and blockchain session continuity factor." },
      { name: "DLCAF — Dual-Layer Consensus", desc: "Requires both PoW nonce validation AND ML-DSA quorum signatures (≥ ceil(N × threat_factor)) before block finality. Threat factor ranges 0.51–0.90 based on anomaly detector output." },
      { name: "FZKRP — Zero-Knowledge Role Proof", desc: "Fiat-Shamir heuristic over ML-DSA public keys. Commitment C = Hash(pk ∥ r), Challenge e = Hash(C ∥ statement ∥ nonce), Response s = r ⊕ (sk × e mod q)." },
      { name: "BASC — Session Continuity", desc: "Session genesis block mined on login. Each action: ref_n = Hash(ref_{n-1} ∥ action ∥ timestamp). Gap detection invalidates session." },
    ],
  },
  {
    title: "API & Edge Functions",
    items: [
      { name: "calculate-trust-scores", desc: "Computes QATD trust scores for all active users. Triggered via cron or on-demand." },
      { name: "rotate-quantum-keys", desc: "Automated PQC key rotation. Generates new ML-KEM keypairs and archives expired keys." },
      { name: "detect-anomalies", desc: "Analyses login patterns and session behaviour to detect anomalies and adjust threat levels." },
      { name: "scim-provisioning", desc: "SCIM 2.0 endpoint for automated user lifecycle management from external identity providers." },
      { name: "generate-quantum-keys", desc: "On-demand ML-KEM and ML-DSA key generation for new users or key refresh." },
    ],
  },
  {
    title: "Security Model",
    items: [
      { name: "Threat Model", desc: "Protects against: quantum key recovery (Shor's), harvest-now-decrypt-later attacks, session hijacking (via BASC), privilege escalation (via FZKRP), audit log tampering (via blockchain)." },
      { name: "Trust Boundaries", desc: "Client ↔ Edge Functions (TLS 1.3), Edge Functions ↔ Database (Supabase RLS), Blockchain layer (PoW + ML-DSA consensus)." },
      { name: "Zero-Trust Principles", desc: "Never trust, always verify. Every request evaluated against QATD score, ABAC policies, device fingerprint, and session blockchain lineage." },
    ],
  },
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-4">Technical Documentation</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Comprehensive reference for algorithms, APIs, and security model.
          </p>

          {sections.map((section) => (
            <div key={section.title} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <Card key={item.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-mono">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

const algorithms = [
  {
    abbr: "QATD",
    name: "Quantum-Adaptive Trust Decay",
    desc: "Continuous trust scoring coupling behavioural entropy, PQC key-age decay, and blockchain session lineage.",
    formula: "T(t) = T_base × e^(-λ_b × Δbehavior) × e^(-λ_k × key_age/90) × C_blockchain",
  },
  {
    abbr: "DLCAF",
    name: "Dual-Layer Consensus with Adaptive Finality",
    desc: "Hybrid consensus requiring simultaneous PoW + ML-DSA quorum signatures with threat-adaptive thresholds.",
    formula: "FINALITY = POW_valid ∧ MLDSA_quorum(signers ≥ ⌈N × threat_factor⌉)",
  },
  {
    abbr: "FZKRP",
    name: "Federated Zero-Knowledge Role Proof",
    desc: "Fiat-Shamir ZK proofs over ML-DSA lattice keys — prove role clearance without revealing identity.",
    formula: "Prove(role_set, threshold) → π; Verify(π, registry) → {true, false}",
  },
  {
    abbr: "BASC",
    name: "Blockchain-Anchored Session Continuity",
    desc: "On-chain session graph where each API call references previous block hash — hijacking is cryptographically detectable.",
    formula: "S_n.ref = Hash(S_{n-1}.ref ∥ action_n ∥ timestamp_n)",
  },
  {
    abbr: "LPR-DA",
    name: "Lattice Proxy Re-Encryption for Delegated Access",
    desc: "Module-LWE proxy re-encryption enabling quantum-safe encrypted credential delegation.",
    formula: "ReKey(pk_A → pk_B) allows proxy to transform Enc(pk_A, m) → Enc(pk_B, m)",
  },
  {
    abbr: "HTAP",
    name: "Homomorphic Trust Aggregation Protocol",
    desc: "Aggregate trust scores from multiple sources without decrypting individual scores.",
    formula: "Enc(T_agg) = Enc(T_1) ⊕ Enc(T_2) ⊕ ... ⊕ Enc(T_n)",
  },
  {
    abbr: "PQ-TSS",
    name: "Post-Quantum Threshold Signature Scheme",
    desc: "t-of-n threshold signatures using ML-DSA partial key shares for distributed signing.",
    formula: "σ = Combine(σ_1, σ_2, ..., σ_t) where t ≤ n shares needed",
  },
  {
    abbr: "ECKG",
    name: "Entropy-Certified Key Generation",
    desc: "Verifiable randomness from multiple entropy sources with min-entropy certification.",
    formula: "K = KDF(H_∞(source_1) ∥ H_∞(source_2) ∥ ... ∥ H_∞(source_n))",
  },
  {
    abbr: "AQC-SLN",
    name: "Adaptive Quantum-Classical Security Level Negotiation",
    desc: "Dynamic protocol negotiation selecting optimal PQC parameters based on threat intelligence.",
    formula: "SecurityLevel = f(threat_level, latency_budget, client_capabilities)",
  },
  {
    abbr: "BV-CRA",
    name: "Blockchain-Verified Credential Revocation Accumulator",
    desc: "Constant-size cryptographic accumulator for O(1) revocation checks anchored on-chain.",
    formula: "Acc' = Acc × g^(credential_hash) mod N; Verify: e(witness, g^hash) = e(Acc, g)",
  },
];

export default function NovelAlgorithms() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="algorithms" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">10 Novel Algorithms</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Original cryptographic constructions — each independently publishable — combining post-quantum security with blockchain technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {algorithms.map((a) => (
            <Card
              key={a.abbr}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => setExpanded(expanded === a.abbr ? null : a.abbr)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    <span className="text-primary font-mono mr-2">{a.abbr}</span>
                    {a.name}
                  </span>
                  {expanded === a.abbr ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
                {expanded === a.abbr && (
                  <div className="mt-3 p-3 rounded-md bg-muted font-mono text-xs overflow-x-auto">
                    {a.formula}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

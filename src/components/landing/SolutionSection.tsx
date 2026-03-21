import { Atom, Blocks, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Atom,
    title: "Post-Quantum Cryptography",
    description: "ML-KEM-1024 key encapsulation and ML-DSA-87 digital signatures — NIST-standardised algorithms providing 256-bit quantum security.",
    features: ["Hybrid classical + PQC auth", "Lattice-based key exchange", "Quantum-safe session tokens"],
  },
  {
    icon: Blocks,
    title: "Blockchain Immutability",
    description: "Tamper-proof audit trails with Dual-Layer Consensus (DLCAF) combining proof-of-work and ML-DSA quorum signatures.",
    features: ["On-chain session anchoring (BASC)", "External RFC 3161 timestamps", "Fork detection & resolution"],
  },
  {
    icon: Shield,
    title: "Zero-Trust Architecture",
    description: "Continuous trust scoring via Quantum-Adaptive Trust Decay (QATD), blending behavioural entropy, key age, and blockchain lineage.",
    features: ["Bayesian trust calculation", "ABAC policy engine", "ZK role proofs (FZKRP)"],
  },
];

const comparison = [
  { feature: "Key Exchange", traditional: "RSA-2048 / ECDH", ours: "ML-KEM-1024 (Lattice)" },
  { feature: "Digital Signatures", traditional: "ECDSA / Ed25519", ours: "ML-DSA-87 + ECDSA Hybrid" },
  { feature: "Audit Trail", traditional: "Database logs (mutable)", ours: "Blockchain (immutable)" },
  { feature: "Trust Model", traditional: "Static RBAC", ours: "QATD continuous scoring" },
  { feature: "Session Integrity", traditional: "JWT / Cookies", ours: "BASC on-chain graph" },
  { feature: "Quantum Resistance", traditional: "None", ours: "NIST FIPS 203/204" },
];

export default function SolutionSection() {
  return (
    <section id="solution" className="py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Solution</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three foundational pillars that make identity management quantum-safe, auditable, and adaptive.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pillars.map((p) => (
            <Card key={p.title} className="group hover:shadow-[var(--shadow-quantum)] transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <p.icon className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-xl">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
                <ul className="space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison table */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Traditional IAM vs Our System</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Traditional IAM</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">This System</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.traditional}</td>
                    <td className="py-3 px-4 text-primary font-medium">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

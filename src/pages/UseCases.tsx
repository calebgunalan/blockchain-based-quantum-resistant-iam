import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Heart, Landmark, Banknote, GraduationCap, Server } from "lucide-react";

const cases = [
  {
    icon: Building2,
    title: "Enterprise Identity Management",
    challenge: "Large organisations struggle with credential sprawl, insider threats, and compliance audits across thousands of employees.",
    solution: "Centralised quantum-safe identity with SCIM 2.0 provisioning, ABAC policies, and immutable blockchain audit trails. Just-In-Time elevated access with automatic expiry.",
    benefits: ["Eliminates credential theft via PQC", "Tamper-proof compliance evidence", "Automated access reviews", "Delegated department-level admin"],
  },
  {
    icon: Heart,
    title: "Healthcare Records (HIPAA)",
    challenge: "Patient health records are high-value targets. Current encryption will be broken by quantum computers, and audit logs can be altered.",
    solution: "Quantum-resistant encryption for records at rest and in transit. FZKRP zero-knowledge proofs allow doctors to prove access rights without revealing patient details to third parties.",
    benefits: ["Future-proof PHI encryption", "Privacy-preserving access control", "Immutable access audit for HIPAA", "Cross-institution identity federation"],
  },
  {
    icon: Landmark,
    title: "Government Digital Identity",
    challenge: "Nation-state adversaries with quantum capabilities threaten sovereign identity infrastructure. Citizens need long-lived credentials.",
    solution: "NIST FIPS 203/204 compliant identity issuance with blockchain anchoring. Threshold signatures (PQ-TSS) require multiple agencies to co-sign identity events.",
    benefits: ["Resistant to nation-state quantum attacks", "Multi-agency threshold signing", "RFC 3161 external timestamping", "W3C Verifiable Credentials compatible"],
  },
  {
    icon: Banknote,
    title: "Financial Services (PCI-DSS)",
    challenge: "Transaction authorisation relies on classical crypto vulnerable to quantum attacks. Fraud detection needs continuous trust evaluation.",
    solution: "QATD continuous trust scoring for every transaction. BASC blockchain-anchored sessions make session hijacking cryptographically detectable.",
    benefits: ["Real-time trust scoring per transaction", "Cryptographic session integrity", "Immutable transaction audit", "Quantum-safe key management"],
  },
  {
    icon: Server,
    title: "Critical Infrastructure (SCADA/ICS)",
    challenge: "Industrial control systems require high-assurance identity for operators with minimal latency overhead.",
    solution: "AQC-SLN dynamically negotiates security level based on operational context. Lightweight PQC operations with <2 ms signing latency.",
    benefits: ["Adaptive security levels", "Low-latency PQC operations", "Incident response playbooks", "Continuous behavioural monitoring"],
  },
  {
    icon: GraduationCap,
    title: "Academic & Research Institutions",
    challenge: "Research data and intellectual property need long-term confidentiality protection against future quantum adversaries.",
    solution: "Entropy-certified key generation (ECKG) ensures cryptographic key quality. Homomorphic trust aggregation (HTAP) enables multi-institution trust without sharing scores.",
    benefits: ["Long-term data confidentiality", "Verifiable key randomness", "Cross-institution trust federation", "Publication-ready audit exports"],
  },
];

export default function UseCases() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-4">Use Cases</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Industry-specific applications of quantum-resistant blockchain IAM.
          </p>

          <div className="space-y-8">
            {cases.map((c) => (
              <Card key={c.title} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <c.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl">{c.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-destructive">Challenge</h4>
                      <p className="text-sm text-muted-foreground mb-4">{c.challenge}</p>
                      <h4 className="font-semibold text-sm mb-2 text-primary">Solution</h4>
                      <p className="text-sm text-muted-foreground">{c.solution}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Benefits</h4>
                      <ul className="space-y-2">
                        {c.benefits.map((b) => (
                          <li key={b} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">✓</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

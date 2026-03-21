import { Building2, Heart, Landmark, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cases = [
  {
    icon: Building2,
    title: "Enterprise Identity",
    description: "Manage employee identities with quantum-safe credentials, SCIM provisioning, and blockchain audit trails for regulatory compliance.",
    benefit: "Eliminates credential theft via PQC + eliminates log tampering via blockchain.",
  },
  {
    icon: Heart,
    title: "Healthcare Records",
    description: "Protect patient health records with quantum-resistant encryption and zero-knowledge proofs for privacy-preserving access control.",
    benefit: "HIPAA-ready with future-proof cryptography and ZK-based data sharing.",
  },
  {
    icon: Landmark,
    title: "Government Digital IDs",
    description: "Issue tamper-proof digital identities anchored on blockchain with NIST-compliant post-quantum signatures.",
    benefit: "Sovereign identity infrastructure resistant to nation-state quantum attacks.",
  },
  {
    icon: Banknote,
    title: "Financial Services",
    description: "Secure transaction authorisation with threshold signatures, continuous trust scoring, and immutable audit logs.",
    benefit: "PCI-DSS compatible with quantum-safe key management and fraud detection.",
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Use Cases</h2>
          <p className="text-lg text-muted-foreground">Applicable across industries where identity security is mission-critical.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {cases.map((c) => (
            <Card key={c.title} className="group hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader>
                <c.icon className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                <p className="text-sm font-medium text-primary">✓ {c.benefit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

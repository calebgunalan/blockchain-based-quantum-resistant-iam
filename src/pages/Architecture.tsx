import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";

const layers = [
  {
    label: "Presentation Layer",
    desc: "React SPA with TypeScript, Tailwind CSS, and shadcn/ui component library. Provides dashboards, admin consoles, block explorer, and SOC dashboard.",
    items: ["React 18", "TypeScript 5", "Tailwind CSS", "shadcn/ui", "Recharts", "React Router"],
  },
  {
    label: "Authentication & Session Layer",
    desc: "Hybrid classical + post-quantum authentication with blockchain-anchored session continuity (BASC). Adaptive MFA with risk-based step-up.",
    items: ["ECDSA P-256 + ML-DSA-65 Hybrid Auth", "BASC Session Anchoring", "Adaptive MFA", "Session Timeout Management", "Account Lockout"],
  },
  {
    label: "Cryptographic Engine",
    desc: "Core post-quantum cryptographic operations using NIST FIPS 203/204 algorithms via @noble/post-quantum library.",
    items: ["ML-KEM-1024 (Key Encapsulation)", "ML-DSA-87 (Digital Signatures)", "FZKRP (ZK Role Proofs)", "PQ-TSS (Threshold Signatures)", "LPR-DA (Proxy Re-Encryption)", "ECKG (Entropy-Certified Keygen)"],
  },
  {
    label: "Trust & Policy Engine",
    desc: "Continuous trust evaluation using the novel QATD algorithm, combined with ABAC policy evaluation and zero-trust enforcement.",
    items: ["QATD Trust Scoring", "ABAC Policy Engine", "Zero-Trust Engine", "HTAP (Homomorphic Trust Aggregation)", "AQC-SLN (Security Level Negotiation)", "Behavioural Analytics"],
  },
  {
    label: "Blockchain Layer",
    desc: "Application-scoped blockchain with dual-layer consensus (DLCAF), mempool management, fork resolution, and external timestamping.",
    items: ["DLCAF Consensus", "Block Mining & Validation", "Transaction Mempool", "Fork Detection & Resolution", "BV-CRA (Credential Revocation)", "RFC 3161 External Timestamps"],
  },
  {
    label: "Data & Infrastructure Layer",
    desc: "Supabase PostgreSQL with Row-Level Security, edge functions for serverless compute, and real-time subscriptions.",
    items: ["Supabase PostgreSQL", "Row-Level Security (RLS)", "Edge Functions (Deno)", "Real-time Subscriptions", "SCIM 2.0 Provisioning", "Automated Key Rotation"],
  },
];

const dataFlows = [
  { from: "User", to: "Hybrid Auth", desc: "ECDSA + ML-DSA dual signature authentication" },
  { from: "Hybrid Auth", to: "BASC", desc: "Session genesis block mined to blockchain" },
  { from: "BASC", to: "QATD Engine", desc: "Continuous trust scoring with blockchain lineage" },
  { from: "QATD Engine", to: "ABAC", desc: "Trust score feeds into access control decisions" },
  { from: "ABAC", to: "Resources", desc: "Policy-governed access with ZK role proofs" },
  { from: "All Layers", to: "Blockchain", desc: "Every action audited as immutable on-chain record" },
];

export default function Architecture() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-4">System Architecture</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Detailed six-layer architecture from user presentation to data persistence.
          </p>

          <div className="space-y-6 mb-16">
            {layers.map((layer, i) => (
              <Card key={layer.label} className="p-6">
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-bold text-primary/30">{i + 1}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{layer.label}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{layer.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.items.map((item) => (
                        <span key={item} className="px-3 py-1 rounded-md bg-muted text-xs font-medium">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-8">Data Flow</h2>
          <div className="space-y-4">
            {dataFlows.map((flow) => (
              <div key={flow.from + flow.to} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                <span className="px-3 py-1 rounded bg-primary/10 text-primary text-sm font-bold shrink-0">{flow.from}</span>
                <span className="text-primary">→</span>
                <span className="px-3 py-1 rounded bg-primary/10 text-primary text-sm font-bold shrink-0">{flow.to}</span>
                <span className="text-sm text-muted-foreground">{flow.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

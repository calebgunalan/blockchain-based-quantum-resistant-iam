import { Card } from "@/components/ui/card";

const layers = [
  {
    label: "Presentation Layer",
    color: "from-primary/20 to-primary/5",
    items: ["React SPA", "Dashboard", "Admin Console", "Block Explorer"],
  },
  {
    label: "Authentication Layer",
    color: "from-[hsl(var(--quantum-info))]/20 to-[hsl(var(--quantum-info))]/5",
    items: ["Hybrid Auth (ECDSA + ML-DSA)", "Adaptive MFA", "Session Management", "BASC Anchoring"],
  },
  {
    label: "Cryptographic Engine",
    color: "from-[hsl(var(--quantum-secondary))]/20 to-[hsl(var(--quantum-secondary))]/5",
    items: ["ML-KEM-1024", "ML-DSA-87", "FZKRP ZK Proofs", "PQ-TSS Threshold Sigs", "LPR-DA Encryption"],
  },
  {
    label: "Trust & Policy Layer",
    color: "from-[hsl(var(--quantum-warning))]/20 to-[hsl(var(--quantum-warning))]/5",
    items: ["QATD Scoring", "ABAC Engine", "Zero-Trust Engine", "HTAP Aggregation"],
  },
  {
    label: "Blockchain Layer",
    color: "from-[hsl(var(--quantum-success))]/20 to-[hsl(var(--quantum-success))]/5",
    items: ["DLCAF Consensus", "Block Mining", "Mempool", "External Timestamps (RFC 3161)"],
  },
  {
    label: "Data Layer",
    color: "from-muted to-muted/50",
    items: ["Supabase PostgreSQL", "RLS Policies", "Edge Functions", "Real-time Subscriptions"],
  },
];

export default function ArchitectureDiagram() {
  return (
    <section id="architecture" className="py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">System Architecture</h2>
          <p className="text-lg text-muted-foreground">Six-layer architecture from presentation to persistence.</p>
        </div>

        <div className="space-y-3">
          {layers.map((layer) => (
            <Card key={layer.label} className={`bg-gradient-to-r ${layer.color} border-border/50 p-5 hover:shadow-md transition-shadow`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="text-sm font-bold w-48 shrink-0">{layer.label}</span>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span key={item} className="px-3 py-1 rounded-md bg-background/80 text-xs font-medium border border-border/50">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>↑ User</span>
            <span className="w-16 h-0.5 bg-border" />
            <span>↓ Database</span>
          </div>
        </div>
      </div>
    </section>
  );
}

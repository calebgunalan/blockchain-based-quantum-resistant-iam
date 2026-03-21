import { Atom, Database, Code2, Palette, BarChart3, Shield, Cpu, Globe } from "lucide-react";

const stack = [
  { icon: Code2, name: "React + TypeScript", role: "Frontend SPA with type-safe components" },
  { icon: Palette, name: "Tailwind CSS", role: "Utility-first styling with dark mode support" },
  { icon: Database, name: "Supabase", role: "PostgreSQL database, auth, edge functions, RLS" },
  { icon: Atom, name: "ML-KEM / ML-DSA", role: "NIST FIPS 203/204 post-quantum algorithms" },
  { icon: Shield, name: "Web Crypto API", role: "Browser-native ECDSA P-256 operations" },
  { icon: Cpu, name: "@noble/post-quantum", role: "Pure JS PQC library for ML-KEM & ML-DSA" },
  { icon: BarChart3, name: "Recharts", role: "Data visualisation for dashboards and analytics" },
  { icon: Globe, name: "Edge Functions", role: "Serverless Deno runtime for key rotation & SCIM" },
];

export default function TechStack() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Technology Stack</h2>
          <p className="text-lg text-muted-foreground">Built entirely on open-source and standards-based technologies.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stack.map((s) => (
            <div key={s.name} className="p-5 rounded-xl bg-background border border-border/50 hover:shadow-md transition-all hover:-translate-y-0.5 text-center">
              <s.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

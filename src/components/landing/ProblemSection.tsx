import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { icon: TrendingUp, value: "$10.5T", label: "Projected cybercrime cost by 2025" },
  { icon: AlertTriangle, value: "RSA & ECDSA", label: "Broken by Shor's algorithm on quantum computers" },
  { icon: Clock, value: "2030–2035", label: "Timeline for cryptographically-relevant quantum computers" },
];

const timeline = [
  { year: "2024", event: "NIST finalises PQC standards (FIPS 203/204)", status: "done" },
  { year: "2027", event: "Early quantum advantage demonstrations", status: "soon" },
  { year: "2030", event: "Harvest-now-decrypt-later attacks peak", status: "warning" },
  { year: "2035", event: "Large-scale quantum computers break RSA-2048", status: "danger" },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">The Quantum Threat</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Current identity systems rely on RSA and ECDSA — algorithms that quantum computers will break.
            The time to act is now.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stats.map((s) => (
            <Card key={s.value} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <s.icon className="h-10 w-10 text-destructive mx-auto mb-4" />
                <p className="text-3xl font-bold mb-2">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Threat Timeline */}
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />
          {timeline.map((t, i) => (
            <div key={t.year} className={`relative flex items-start mb-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
              <div className={`flex-1 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"} pl-12 md:pl-0`}>
                <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full mb-2 ${
                  t.status === "done" ? "bg-primary/10 text-primary" :
                  t.status === "soon" ? "bg-[hsl(var(--quantum-warning))]/10 text-[hsl(var(--quantum-warning))]" :
                  t.status === "warning" ? "bg-[hsl(var(--quantum-warning))]/20 text-[hsl(var(--quantum-warning))]" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {t.year}
                </span>
                <p className="text-sm text-muted-foreground">{t.event}</p>
              </div>
              <div className="absolute left-2 md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full border-2 border-primary bg-background mt-1" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

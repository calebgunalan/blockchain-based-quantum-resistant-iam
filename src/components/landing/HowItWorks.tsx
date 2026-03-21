import { KeyRound, Link2, Activity, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: KeyRound,
    step: "01",
    title: "Authenticate",
    description: "Hybrid classical + PQC authentication using ECDSA P-256 and ML-DSA-65 dual signatures.",
  },
  {
    icon: Link2,
    step: "02",
    title: "Anchor Session",
    description: "Session genesis mined into blockchain via BASC, creating a tamper-evident on-chain session graph.",
  },
  {
    icon: Activity,
    step: "03",
    title: "Continuous Trust",
    description: "QATD algorithm continuously scores trust using behavioural entropy, PQC key age, and chain lineage.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Govern Access",
    description: "ABAC policies + FZKRP zero-knowledge role proofs control access without revealing identity.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">Four steps from authentication to quantum-safe access control.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center group">
              {i < 3 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
              )}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-6 group-hover:bg-primary/20 transition-colors">
                <s.icon className="h-8 w-8 text-primary" />
              </div>
              <span className="block text-xs font-bold text-primary mb-2">STEP {s.step}</span>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Play, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function HeroSection() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const { error } = await signIn("calebgunalan2005@gmail.com", "123123");
    if (!error) navigate("/dashboard");
    setIsLoading(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 landing-gradient" />
      <div className="absolute inset-0">
        <div className="landing-particle landing-particle-1" />
        <div className="landing-particle landing-particle-2" />
        <div className="landing-particle landing-particle-3" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 landing-fade-in">
          <Shield className="h-4 w-4" />
          NIST FIPS 203 & 204 Compliant
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 landing-fade-in" style={{ animationDelay: "0.1s" }}>
          Quantum-Resistant{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[hsl(var(--quantum-secondary))]">
            Blockchain IAM
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto landing-fade-in" style={{ animationDelay: "0.2s" }}>
          Post-Quantum Secure Architecture for Identity and Access Management
          in Critical Infrastructures — featuring 10 novel cryptographic algorithms.
        </p>

        <div className="flex flex-wrap gap-4 justify-center landing-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" onClick={handleDemoLogin} disabled={isLoading} className="text-lg px-8 py-6">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            Try Live Demo
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}>
            <BookOpen className="mr-2 h-5 w-5" />
            View Architecture
          </Button>
        </div>

        {/* Mini architecture preview */}
        <div className="mt-16 landing-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="inline-flex items-center gap-3 flex-wrap justify-center text-sm text-muted-foreground">
            {["User Auth", "PQC Engine", "Blockchain Layer", "ABAC/ZK", "Resources"].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-card border border-border font-medium text-foreground">
                  {step}
                </span>
                {i < 4 && <span className="text-primary">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

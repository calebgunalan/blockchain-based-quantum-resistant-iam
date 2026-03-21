import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Monitor, Shield, Activity, Blocks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Shield, label: "Hybrid PQC Authentication" },
  { icon: Activity, label: "Live QATD Trust Scoring" },
  { icon: Blocks, label: "Blockchain Block Explorer" },
  { icon: Monitor, label: "SOC Security Dashboard" },
];

export default function DemoSection() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemo = async () => {
    setIsLoading(true);
    const { error } = await signIn("calebgunalan2005@gmail.com", "123123");
    if (!error) navigate("/dashboard");
    setIsLoading(false);
  };

  return (
    <section id="demo" className="py-24">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-4">Try the Live Demo</h2>
        <p className="text-lg text-muted-foreground mb-10">
          Experience the full system — authentication, blockchain audit, trust scoring, and more — instantly with demo credentials.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {features.map((f) => (
            <div key={f.label} className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <f.icon className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-medium">{f.label}</p>
            </div>
          ))}
        </div>

        <Button size="lg" onClick={handleDemo} disabled={isLoading} className="text-lg px-10 py-6">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
          Launch Demo
        </Button>

        <p className="text-xs text-muted-foreground mt-4">No signup required. Uses pre-configured demo account.</p>
      </div>
    </section>
  );
}

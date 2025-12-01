import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Lock, Key, Play, Loader2, Atom, Blocks } from "lucide-react";

const Index = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const { error } = await signIn("calebgunalan2005@gmail.com", "123123");
    if (!error) {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Quantum-Resistant Blockchain IAM</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Post-quantum cryptographic identity and access management system with 
            blockchain-based audit trails and zero-trust security architecture.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Button size="lg" onClick={() => navigate("/auth")}>
              <Key className="h-4 w-4 mr-2" />
              Admin Portal
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/resource-auth")}>
              <Users className="h-4 w-4 mr-2" />
              Employee Access
            </Button>
          </div>
          
          {/* Demo Quick Access */}
          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-[hsl(var(--demo-gold))]/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2">
              <Play className="h-5 w-5 text-[hsl(var(--demo-gold))]" />
              Quick Demo Access
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Instantly access the system with demo credentials for presentation purposes
            </p>
            <Button 
              size="lg"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90 font-semibold"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Demo Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <Atom className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Post-Quantum Security</CardTitle>
              <CardDescription>
                ML-KEM-1024 & ML-DSA-87 NIST-standardized algorithms for quantum resistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Quantum-safe key encapsulation</li>
                <li>• Lattice-based digital signatures</li>
                <li>• 256-bit security level</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Blocks className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Blockchain Audit</CardTitle>
              <CardDescription>
                Immutable audit trails with proof-of-stake consensus mechanism
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Tamper-proof audit logs</li>
                <li>• 235 tx/s throughput</li>
                <li>• Distributed consensus</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Zero-Trust Architecture</CardTitle>
              <CardDescription>
                Bayesian trust scoring with continuous verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Dynamic trust calculation</li>
                <li>• Behavioral analytics</li>
                <li>• Adaptive authentication</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

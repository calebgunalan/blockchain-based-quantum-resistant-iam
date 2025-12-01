import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
export default function ResourceAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const {
    signIn,
    user
  } = useAuth();
  const navigate = useNavigate();
  if (user) {
    navigate("/resources");
    return null;
  }
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const {
      error
    } = await signIn(email, password);
    if (error) {
      setError(error.message || "Invalid credentials");
      setIsLoading(false);
      return;
    }
    navigate("/resources");
  };
  return <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" onClick={() => navigate("/")} className="w-fit mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl font-bold text-center">Employee Access</CardTitle>
          <CardDescription className="text-center">
            Sign in to access company resources, documents, and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your.email@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Access</span>
              </div>
            </div>
            
            <Button 
              type="button"
              className="w-full bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90 font-semibold"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                setError("");
                const { error: signInError } = await signIn("calebgunalan2005@gmail.com", "123123");
                if (signInError) {
                  setError(signInError.message || "Demo login failed");
                  setIsLoading(false);
                  return;
                }
                navigate("/resources");
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              Demo Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
}
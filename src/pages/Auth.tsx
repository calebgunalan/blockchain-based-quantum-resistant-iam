import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, user, userRole } = useAuth();
  const navigate = useNavigate();

  // If authenticated
  if (user) {
    // Only admins can access IAM system
    if (userRole === 'admin') {
      navigate("/dashboard");
      return null;
    }
    // Non-admins: stay on this page with guidance (no forwarding)
  }


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Check user role after successful sign in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const role = roleData?.role;

        // Only allow admins to access IAM portal
        if (role !== 'admin') {
          // Sign out the user immediately
          await supabase.auth.signOut();
          
          // Check if user exists in the system
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (profile) {
            setError('Please login through Resource Access portal at /resources. This is the IAM Administration login for admins only.');
          } else {
            setError('Login details not found. Please contact your administrator.');
          }
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="w-fit mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <CardTitle className="text-2xl font-bold text-center">IAM System - Admin Login</CardTitle>
          <CardDescription className="text-center">
            Administrator access only. For resource access, use /resource-auth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && userRole !== 'admin' && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Please login through Resource Access portal at /resources. This is the IAM Administration login for admins only.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In as Admin
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
                setIsLoading(false);
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              Demo Login
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => navigate("/forgot-password")}
              className="text-sm"
            >
              Forgot your password?
            </Button>
            <p className="text-sm text-muted-foreground">
              Need an account? Contact your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
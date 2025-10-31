import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ error: any }>;
  refreshUserRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role immediately and set up refresh
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setUserRole(roleData?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  const refreshUserRole = () => {
    if (user?.id) {
      fetchUserRole(user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if account is locked before attempting login
      const { data: isLocked, error: lockCheckError } = await supabase.rpc('is_account_locked' as any, {
        user_email: email,
      });

      if (isLocked) {
        const error = { message: 'Account is locked due to multiple failed login attempts. Please contact your administrator.' };
        toast({
          title: "Account locked",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Capture device fingerprint
      const deviceFingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString()
      };

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Record failed login attempt
        try {
          await supabase.from('failed_login_attempts' as any).insert({
            email,
            user_agent: navigator.userAgent,
          });

          // Check if account should be locked now
          await supabase.rpc('check_and_lock_account' as any, {
            user_email: email,
            max_attempts: 5,
            lockout_duration: '30 minutes',
          });
        } catch (recordError) {
          console.error('Error recording failed attempt:', recordError);
        }

        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Log session with device fingerprint and generate quantum keys
      if (data.user) {
        setTimeout(async () => {
          try {
            // Create session log  
            await supabase.from('user_sessions').insert({
              user_id: data.user.id,
              session_token: data.session?.access_token || '',
              ip_address: '0.0.0.0', // Will be populated by DB function
              user_agent: navigator.userAgent
            });

            // Create/update device fingerprint
            await supabase.from('device_fingerprints').upsert({
              user_id: data.user.id,
              device_id: btoa(navigator.userAgent + navigator.platform),
              fingerprint_data: deviceFingerprint,
              last_seen_at: new Date().toISOString(),
              trust_score: 50 // Initial trust score
            });

            // Generate quantum keys if they don't exist
            const { data: quantumKeys } = await supabase
              .from('quantum_keys')
              .select('id')
              .eq('user_id', data.user.id)
              .eq('is_active', true)
              .limit(1);

            if (!quantumKeys || quantumKeys.length === 0) {
              // Call edge function to generate quantum keys
              console.log('Generating quantum keys for user...');
              try {
                await supabase.functions.invoke('generate-quantum-keys', {
                  body: { userId: data.user.id }
                });
                console.log('Quantum keys generation initiated');
              } catch (keyError) {
                console.error('Error generating quantum keys:', keyError);
              }
            }

            // Calculate trust score using the AI risk calculation function
            try {
              await supabase.rpc('calculate_ai_risk_score', {
                _user_id: data.user.id,
                _current_context: deviceFingerprint
              });
              console.log('Trust score calculated');
            } catch (scoreError) {
              console.error('Error calculating trust score:', scoreError);
            }

            // Log successful login for audit
            await supabase.rpc('log_audit_event', {
              _action: 'LOGIN_SUCCESS',
              _resource: 'authentication',
              _details: {
                timestamp: new Date().toISOString(),
                device: deviceFingerprint
              }
            });
          } catch (err) {
            console.error('Error logging session:', err);
          }
        }, 0);
      }

      return { error };
    } catch (err: any) {
      const error = { message: err.message || 'Sign in failed' };
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear session state first
      setSession(null);
      setUser(null);
      setUserRole(null);
      
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== "Auth session missing!") {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully."
        });
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Clear state even if logout fails
      setSession(null);
      setUser(null);
      setUserRole(null);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
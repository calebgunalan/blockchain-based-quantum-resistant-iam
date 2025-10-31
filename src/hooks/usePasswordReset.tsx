import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Track password reset request
      await supabase.rpc('log_audit_event', {
        _action: 'PASSWORD_RESET_REQUEST',
        _resource: 'authentication',
        _details: { email }
      });

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Track password reset completion
      await supabase.rpc('log_audit_event', {
        _action: 'PASSWORD_RESET_COMPLETE',
        _resource: 'authentication',
        _details: { timestamp: new Date().toISOString() }
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    requestPasswordReset,
    resetPassword,
  };
}

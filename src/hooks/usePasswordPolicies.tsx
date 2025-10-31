import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface PasswordPolicy {
  id: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  password_expiry_days: number;
  password_history_count: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePasswordPolicies() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPolicy();
    } else {
      setPolicy(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setPolicy(data);
    } catch (error) {
      console.error('Error fetching password policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (updates: Partial<PasswordPolicy>) => {
    try {
      const { data, error } = await supabase
        .from('password_policies')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;
      if (data) setPolicy(data);
      return data;
    } catch (error) {
      console.error('Error updating password policy:', error);
      throw error;
    }
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!policy) return { isValid: true, errors: [] };

    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`);
    }
    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (policy.require_numbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (policy.require_special_chars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { isValid: errors.length === 0, errors };
  };

  return {
    policy,
    loading,
    updatePolicy,
    validatePassword,
    refetch: fetchPolicy
  };
}

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface AccountLockout {
  id: string;
  user_id: string;
  email: string;
  locked_at: string;
  unlock_at: string;
  reason: string | null;
  is_active: boolean;
}

export interface FailedLoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_timestamp: string;
}

export function useAccountLockout() {
  const { user } = useAuth();
  const [lockouts, setLockouts] = useState<AccountLockout[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedLoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLockouts();
      fetchFailedAttempts();
    } else {
      setLockouts([]);
      setFailedAttempts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchLockouts = async () => {
    try {
      const { data, error } = await supabase
        .from('account_lockouts' as any)
        .select('*')
        .order('locked_at', { ascending: false });

      if (error) throw error;
      setLockouts((data as any) || []);
    } catch (error) {
      console.error('Error fetching lockouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFailedAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('failed_login_attempts' as any)
        .select('*')
        .order('attempt_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setFailedAttempts((data as any) || []);
    } catch (error) {
      console.error('Error fetching failed attempts:', error);
    }
  };

  const recordFailedAttempt = async (email: string) => {
    try {
      const deviceInfo = {
        ip_address: null, // Will be set by database trigger if available
        user_agent: navigator.userAgent,
      };

      await supabase.from('failed_login_attempts' as any).insert({
        email,
        ...deviceInfo,
      });

      // Check if account should be locked
      const { data, error } = await supabase.rpc('check_and_lock_account' as any, {
        user_email: email,
        max_attempts: 5,
        lockout_duration: '30 minutes',
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      throw error;
    }
  };

  const checkAccountLocked = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_account_locked' as any, {
        user_email: email,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking account lock:', error);
      return false;
    }
  };

  const unlockAccount = async (lockoutId: string) => {
    try {
      const { error } = await supabase
        .from('account_lockouts' as any)
        .update({ is_active: false })
        .eq('id', lockoutId);

      if (error) throw error;

      await supabase.rpc('log_audit_event', {
        _action: 'ACCOUNT_UNLOCK',
        _resource: 'account_lockout',
        _resource_id: lockoutId,
        _details: { timestamp: new Date().toISOString() }
      });

      await fetchLockouts();
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw error;
    }
  };

  const manualLockAccount = async (email: string, duration: string, reason: string) => {
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (!userData) throw new Error('User not found');

      const unlock_at = new Date();
      if (duration === '30min') {
        unlock_at.setMinutes(unlock_at.getMinutes() + 30);
      } else if (duration === '1hour') {
        unlock_at.setHours(unlock_at.getHours() + 1);
      } else if (duration === '24hours') {
        unlock_at.setHours(unlock_at.getHours() + 24);
      } else if (duration === 'permanent') {
        unlock_at.setFullYear(unlock_at.getFullYear() + 100);
      }

      await supabase.from('account_lockouts' as any).insert({
        user_id: userData.user_id,
        email,
        unlock_at: unlock_at.toISOString(),
        reason,
        locked_by_user_id: user?.id,
      });

      await supabase.rpc('log_audit_event', {
        _action: 'ACCOUNT_MANUAL_LOCK',
        _resource: 'account_lockout',
        _details: { email, duration, reason }
      });

      await fetchLockouts();
    } catch (error) {
      console.error('Error manually locking account:', error);
      throw error;
    }
  };

  return {
    lockouts,
    failedAttempts,
    loading,
    recordFailedAttempt,
    checkAccountLocked,
    unlockAccount,
    manualLockAccount,
    fetchLockouts,
    fetchFailedAttempts,
  };
}

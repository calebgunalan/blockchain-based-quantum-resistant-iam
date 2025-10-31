import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const checkSessionTimeout = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      const { data, error } = await supabase.rpc('should_session_timeout' as any, {
        session_id: sessionId,
        settings_user_id: user.id,
      });

      if (error) throw error;

      const timeoutData = data as any;
      
      if (timeoutData.should_timeout) {
        toast({
          title: "Session expired",
          description: timeoutData.reason,
          variant: "destructive",
        });
        await signOut();
        return;
      }

      const secondsUntilTimeout = timeoutData.time_until_timeout_seconds;
      setTimeUntilTimeout(secondsUntilTimeout);

      // Show warning if less than 5 minutes remaining
      if (secondsUntilTimeout < 300 && !timeoutWarning) {
        setTimeoutWarning(true);
        toast({
          title: "Session expiring soon",
          description: `Your session will expire in ${Math.floor(secondsUntilTimeout / 60)} minutes.`,
        });
      }
    } catch (error) {
      console.error('Error checking session timeout:', error);
    }
  }, [user, sessionId, timeoutWarning, signOut, toast]);

  const extendSession = useCallback(async () => {
    if (!user || !sessionId) return;

    try {
      // Update session activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);

      setTimeoutWarning(false);
      
      toast({
        title: "Session extended",
        description: "Your session has been extended.",
      });

      // Recheck timeout
      await checkSessionTimeout();
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }, [user, sessionId, checkSessionTimeout, toast]);

  // Get current session ID
  useEffect(() => {
    const getCurrentSession = async () => {
      if (!user) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_token', session.access_token)
          .eq('is_active', true)
          .single();

        if (data) {
          setSessionId(data.id);
        }
      } catch (error) {
        console.error('Error getting current session:', error);
      }
    };

    getCurrentSession();
  }, [user]);

  // Check timeout periodically
  useEffect(() => {
    if (!user || !sessionId) return;

    checkSessionTimeout();
    const interval = setInterval(checkSessionTimeout, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, sessionId, checkSessionTimeout]);

  // Track user activity to extend session
  useEffect(() => {
    if (!user || !sessionId) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    let lastActivity = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      // Only update if more than 1 minute since last activity
      if (now - lastActivity > 60000) {
        lastActivity = now;
        extendSession();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, sessionId, extendSession]);

  return {
    timeoutWarning,
    timeUntilTimeout,
    extendSession,
    checkSessionTimeout,
  };
}

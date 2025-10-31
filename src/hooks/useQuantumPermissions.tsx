import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useQuantumPermissions() {
  const [hasViewAccess, setHasViewAccess] = useState(false);
  const [hasManageAccess, setHasManageAccess] = useState(false);
  const [hasConfigureAccess, setHasConfigureAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (user) {
      checkPermissions();
    } else {
      setLoading(false);
    }
  }, [user, userRole]);

  const checkPermissions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Admins have all access
      if (userRole === 'admin') {
        setHasViewAccess(true);
        setHasManageAccess(true);
        setHasConfigureAccess(true);
        return;
      }

      // Check specific permissions
      const [viewResult, manageResult, configureResult] = await Promise.all([
        supabase.rpc('has_quantum_permission', {
          _user_id: user.id,
          _permission_type: 'view'
        }),
        supabase.rpc('has_quantum_permission', {
          _user_id: user.id,
          _permission_type: 'manage'
        }),
        supabase.rpc('has_quantum_permission', {
          _user_id: user.id,
          _permission_type: 'configure'
        })
      ]);

      setHasViewAccess(viewResult.data || false);
      setHasManageAccess(manageResult.data || false);
      setHasConfigureAccess(configureResult.data || false);

    } catch (error) {
      console.error('Error checking quantum permissions:', error);
      setHasViewAccess(false);
      setHasManageAccess(false);
      setHasConfigureAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const grantPermission = async (
    permissionType: 'view' | 'manage' | 'configure',
    userId?: string, 
    groupId?: string, 
    expiresAt?: string
  ) => {
    if (!user || userRole !== 'admin') {
      throw new Error('Only admins can grant quantum permissions');
    }

    try {
      const { error } = await supabase
        .from('quantum_permissions')
        .insert({
          user_id: userId,
          group_id: groupId,
          permission_type: permissionType,
          granted_by: user.id,
          expires_at: expiresAt
        });

      if (error) throw error;

      // Refresh permissions if granting to current user
      if (userId === user.id) {
        await checkPermissions();
      }

    } catch (error) {
      console.error('Error granting quantum permission:', error);
      throw error;
    }
  };

  const revokePermission = async (permissionId: string) => {
    if (!user || userRole !== 'admin') {
      throw new Error('Only admins can revoke quantum permissions');
    }

    try {
      const { error } = await supabase
        .from('quantum_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) throw error;

      await checkPermissions();

    } catch (error) {
      console.error('Error revoking quantum permission:', error);
      throw error;
    }
  };

  return {
    hasViewAccess,
    hasManageAccess,
    hasConfigureAccess,
    loading,
    grantPermission,
    revokePermission,
    refetch: checkPermissions
  };
}
import { useState, useEffect } from 'react';
import { JITAccessManager, JITAccessSession, JITAccessRequest } from '@/lib/jit-access-manager';
import { toast } from '@/hooks/use-toast';

export function useJITAccess() {
  const [manager] = useState(() => new JITAccessManager());
  const [sessions, setSessions] = useState<JITAccessSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JITAccessSession[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUserSessions = async (userId: string) => {
    try {
      setLoading(true);
      const data = await manager.getUserSessions(userId);
      setSessions(data);
    } catch (error) {
      console.error('Error loading JIT sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const data = await manager.getPendingRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async (request: JITAccessRequest) => {
    const result = await manager.requestAccess(request);
    
    if (result.success) {
      toast({
        title: 'Access Request Submitted',
        description: result.message
      });
      await loadUserSessions(request.userId);
    } else {
      toast({
        title: 'Request Failed',
        description: result.message,
        variant: 'destructive'
      });
    }

    return result;
  };

  const approveAccess = async (sessionId: string, approverId: string, notes?: string) => {
    const success = await manager.approveAccess(sessionId, approverId, notes);
    
    if (success) {
      toast({
        title: 'Access Approved',
        description: 'The access request has been approved'
      });
      await loadPendingRequests();
    } else {
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve the request',
        variant: 'destructive'
      });
    }

    return success;
  };

  const denyAccess = async (sessionId: string, approverId: string, reason: string) => {
    const success = await manager.denyAccess(sessionId, approverId, reason);
    
    if (success) {
      toast({
        title: 'Access Denied',
        description: 'The access request has been denied'
      });
      await loadPendingRequests();
    } else {
      toast({
        title: 'Denial Failed',
        description: 'Failed to deny the request',
        variant: 'destructive'
      });
    }

    return success;
  };

  const revokeAccess = async (sessionId: string, revokerId: string, reason: string) => {
    const success = await manager.revokeAccess(sessionId, revokerId, reason);
    
    if (success) {
      toast({
        title: 'Access Revoked',
        description: 'The access has been revoked'
      });
    } else {
      toast({
        title: 'Revocation Failed',
        description: 'Failed to revoke access',
        variant: 'destructive'
      });
    }

    return success;
  };

  const checkAccess = async (userId: string, resourceType: string, resourceId: string) => {
    return await manager.hasAccess(userId, resourceType, resourceId);
  };

  return {
    sessions,
    pendingRequests,
    loading,
    requestAccess,
    approveAccess,
    denyAccess,
    revokeAccess,
    checkAccess,
    loadUserSessions,
    loadPendingRequests
  };
}

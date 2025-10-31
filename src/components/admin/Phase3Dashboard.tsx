/**
 * Phase 3: IAM Enhancements Dashboard
 * Just-In-Time Access & Adaptive MFA Management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useJITAccess } from '@/hooks/useJITAccess';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function Phase3Dashboard() {
  const { user } = useAuth();
  const {
    sessions,
    pendingRequests,
    loading,
    approveAccess,
    denyAccess,
    revokeAccess,
    loadUserSessions,
    loadPendingRequests
  } = useJITAccess();

  const [stats, setStats] = useState({
    totalRequests: 0,
    activeAccess: 0,
    pendingApproval: 0,
    autoApproved: 0
  });

  useEffect(() => {
    if (user) {
      loadUserSessions(user.id);
      loadPendingRequests();
    }
  }, [user]);

  useEffect(() => {
    const activeCount = sessions.filter(s => s.status === 'active').length;
    const autoCount = sessions.filter(s => s.auto_approved).length;
    
    setStats({
      totalRequests: sessions.length,
      activeAccess: activeCount,
      pendingApproval: pendingRequests.length,
      autoApproved: autoCount
    });
  }, [sessions, pendingRequests]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      pending: 'secondary',
      approved: 'default',
      expired: 'outline',
      revoked: 'destructive',
      denied: 'destructive'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const handleApprove = async (sessionId: string) => {
    if (!user) return;
    await approveAccess(sessionId, user.id, 'Approved via dashboard');
  };

  const handleDeny = async (sessionId: string) => {
    if (!user) return;
    await denyAccess(sessionId, user.id, 'Denied via dashboard');
  };

  const handleRevoke = async (sessionId: string) => {
    if (!user) return;
    await revokeAccess(sessionId, user.id, 'Revoked via dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Phase 3 features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Phase 3: IAM Enhancements</h2>
        <p className="text-muted-foreground">
          Just-In-Time Access Control & Risk-Based Adaptive MFA
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All JIT access requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Access</CardTitle>
            <Unlock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccess}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting admin review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.autoApproved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Low-risk automatic grants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Access Requests</CardTitle>
              <CardDescription>
                Review and approve/deny JIT access requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.resource_type}</div>
                            <div className="text-sm text-muted-foreground">{request.resource_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.access_level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getRiskLevelColor(request.risk_level)}`} />
                            <span className="capitalize">{request.risk_level}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(request.requested_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(request.expires_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeny(request.id)}
                              disabled={loading}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Deny
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Access Sessions</CardTitle>
              <CardDescription>
                Currently active JIT access sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.filter(s => s.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active sessions
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Auto-Approved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.filter(s => s.status === 'active').map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.resource_type}</div>
                            <div className="text-sm text-muted-foreground">{session.resource_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.access_level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getRiskLevelColor(session.risk_level)}`} />
                            <span className="capitalize">{session.risk_level}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(session.expires_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {session.auto_approved ? (
                            <Badge variant="secondary">Auto</Badge>
                          ) : (
                            <Badge variant="default">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRevoke(session.id)}
                            disabled={loading}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access History</CardTitle>
              <CardDescription>
                All JIT access requests and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.resource_type}</div>
                          <div className="text-sm text-muted-foreground">{session.resource_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${getRiskLevelColor(session.risk_level)}`} />
                          <span className="capitalize">{session.risk_level}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(session.requested_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {session.revoked_at
                          ? new Date(session.revoked_at).toLocaleString()
                          : session.status === 'expired'
                          ? new Date(session.expires_at).toLocaleString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

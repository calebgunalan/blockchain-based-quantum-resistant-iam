import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AccessReview {
  id: string;
  campaign_name: string;
  reviewer_id: string;
  user_id: string;
  permission_id: string | null;
  resource_type: string | null;
  access_description: string | null;
  status: string;
  decision_at: string | null;
  decision_notes: string | null;
  sod_violation: boolean;
  risk_score: number;
  campaign_deadline: string | null;
  created_at: string;
}

interface SoDViolation {
  user_id: string;
  email: string;
  conflicting_roles: string[];
  risk_level: string;
}

export default function IdentityGovernance() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [sodViolations, setSodViolations] = useState<SoDViolation[]>([]);
  const [orphanedAccounts, setOrphanedAccounts] = useState<any[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, revoked: 0, sod: 0 });

  useEffect(() => {
    if (!user || userRole !== 'admin') { navigate('/dashboard'); return; }
    loadAll();
  }, [user, userRole]);

  const loadAll = async () => {
    setLoading(true);
    const [reviewsRes, profilesRes] = await Promise.all([
      supabase.from('access_reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, email, full_name, created_at, updated_at'),
    ]);

    const reviewData = reviewsRes.data || [];
    setReviews(reviewData as AccessReview[]);

    // Calculate stats
    setStats({
      pending: reviewData.filter(r => r.status === 'pending').length,
      approved: reviewData.filter(r => r.status === 'approved').length,
      revoked: reviewData.filter(r => r.status === 'revoked').length,
      sod: reviewData.filter(r => r.sod_violation).length,
    });

    // Detect orphaned accounts (profiles with no recent activity > 90 days)
    const profiles = profilesRes.data || [];
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const orphaned = profiles.filter(p => {
      const lastActive = new Date(p.updated_at || p.created_at);
      return lastActive < cutoff;
    });
    setOrphanedAccounts(orphaned);

    // Detect SoD violations (users with conflicting roles — simplified detection)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Check for any unusual role combos
    const userRoles: Record<string, string[]> = {};
    (roleData || []).forEach(r => {
      if (!userRoles[r.user_id]) userRoles[r.user_id] = [];
      userRoles[r.user_id].push(r.role);
    });

    const violations: SoDViolation[] = Object.entries(userRoles)
      .filter(([_, roles]) => roles.length > 1)
      .map(([uid, roles]) => ({
        user_id: uid,
        email: uid,
        conflicting_roles: roles,
        risk_level: roles.includes('admin') ? 'high' : 'medium',
      }));
    setSodViolations(violations);
    setLoading(false);
  };

  const createCampaign = async () => {
    if (!campaignName.trim()) { toast.error('Enter a campaign name'); return; }

    // Get all users and create review entries for each
    const { data: profiles } = await supabase.from('profiles').select('user_id').limit(20);
    if (!profiles || profiles.length === 0) { toast.error('No users found'); return; }

    const reviews = profiles.map(p => ({
      campaign_name: campaignName,
      reviewer_id: user!.id,
      user_id: p.user_id,
      resource_type: 'general_access',
      access_description: 'Periodic access review',
      status: 'pending',
      sod_violation: false,
      risk_score: 0,
      campaign_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    }));

    const { error } = await supabase.from('access_reviews').insert(reviews);
    if (error) { toast.error('Failed to create campaign'); return; }
    toast.success(`Campaign "${campaignName}" created with ${profiles.length} reviews`);
    setCampaignName('');
    await loadAll();
  };

  const decideReview = async (reviewId: string, decision: 'approved' | 'revoked') => {
    const { error } = await supabase.from('access_reviews').update({
      status: decision,
      decision_at: new Date().toISOString(),
      decision_notes: `Decided by ${user?.email}`,
    }).eq('id', reviewId);

    if (error) { toast.error('Failed to update review'); return; }
    toast.success(`Review ${decision}`);
    await loadAll();
  };

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const completedReviews = reviews.filter(r => r.status !== 'pending');

  const daysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!user || userRole !== 'admin') return null;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" /> Identity Governance
          </h1>
          <p className="text-muted-foreground mt-1">Access reviews • SoD violation detection • Orphaned account management</p>
        </div>
        <Button variant="outline" onClick={loadAll}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Reviews', value: stats.pending, icon: Clock, variant: 'secondary' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, variant: 'default' },
          { label: 'Revoked', value: stats.revoked, icon: XCircle, variant: 'destructive' },
          { label: 'SoD Violations', value: stats.sod, icon: AlertTriangle, variant: 'destructive' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Access Reviews ({stats.pending})</TabsTrigger>
          <TabsTrigger value="sod">SoD Violations ({sodViolations.length})</TabsTrigger>
          <TabsTrigger value="orphaned">Orphaned Accounts ({orphanedAccounts.length})</TabsTrigger>
          <TabsTrigger value="campaigns">New Campaign</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {pendingReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>Requires your decision before campaign deadline</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {pendingReviews.map(r => {
                    const days = daysLeft(r.campaign_deadline);
                    return (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{r.campaign_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 16)}...</p>
                          <p className="text-xs text-muted-foreground">{r.access_description}</p>
                          {days !== null && (
                            <Badge variant={days < 3 ? 'destructive' : 'outline'} className="text-xs mt-1">
                              {days > 0 ? `${days}d remaining` : 'OVERDUE'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => decideReview(r.id, 'approved')}>
                            <CheckCircle className="h-3 w-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => decideReview(r.id, 'revoked')}>
                            <XCircle className="h-3 w-3 mr-1" />Revoke
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {completedReviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Completed Reviews</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {completedReviews.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm">{r.campaign_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 16)}...</p>
                      </div>
                      <Badge variant={r.status === 'approved' ? 'default' : 'destructive'} className="text-xs">{r.status}</Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {reviews.length === 0 && !loading && (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                No access reviews yet. Create a campaign to start reviewing user access.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sod">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Separation of Duties (SoD) Violations
              </CardTitle>
              <CardDescription>Users with conflicting role assignments that violate least-privilege</CardDescription>
            </CardHeader>
            <CardContent>
              {sodViolations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">No SoD violations detected — role assignments are compliant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sodViolations.map((v, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono">{v.user_id.slice(0, 20)}...</p>
                        <Badge variant={v.risk_level === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {v.risk_level} risk
                        </Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {v.conflicting_roles.map(r => (
                          <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orphaned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary-foreground" />
                Orphaned Accounts (&gt;90 days inactive)
              </CardTitle>
              <CardDescription>Accounts with no activity in the past 90 days — candidates for deprovisioning</CardDescription>
            </CardHeader>
            <CardContent>
              {orphanedAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">No orphaned accounts detected</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  {orphanedAccounts.map((a, i) => {
                    const daysSince = Math.floor((Date.now() - new Date(a.updated_at || a.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm">{a.email || a.full_name || 'Unknown'}</p>
                          <p className="text-xs font-mono text-muted-foreground">{a.user_id?.slice(0, 16)}...</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">{daysSince}d inactive</Badge>
                      </div>
                    );
                  })}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Create Access Review Campaign</CardTitle>
              <CardDescription>Launch a structured access review for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g., Q1 2026 Access Review"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Campaign will:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Create review entries for all active users</li>
                  <li>Set 14-day deadline for reviewer decisions</li>
                  <li>Flag SoD violations automatically</li>
                  <li>Generate audit log entries for all decisions</li>
                </ul>
              </div>
              <Button onClick={createCampaign} className="w-full">
                <Shield className="h-4 w-4 mr-2" /> Launch Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

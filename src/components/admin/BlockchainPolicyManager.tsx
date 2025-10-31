import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus, 
  FileCheck, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { toast } from '@/hooks/use-toast';
import { BlockchainPolicy } from '@/lib/blockchain-policy-engine';

export function BlockchainPolicyManager() {
  const { blockchain } = useBlockchain();
  const [policies, setPolicies] = useState<BlockchainPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      // In production, this would fetch from blockchain
      // For now, we'll show example policies
      const examplePolicies: BlockchainPolicy[] = [
        {
          id: 'policy-001',
          name: 'Admin Full Access',
          resource: 'all_resources',
          allowedRoles: ['admin'],
          timeRestrictions: undefined,
          quantumSignatureRequired: true,
          trustScoreMinimum: 80,
          mfaRequired: true,
          conditions: [],
          createdAt: new Date(),
          isActive: true,
          version: 1
        },
        {
          id: 'policy-002',
          name: 'Business Hours Document Access',
          resource: 'documents',
          allowedRoles: ['user', 'moderator', 'admin'],
          timeRestrictions: {
            days: [1, 2, 3, 4, 5],
            hours: { start: 9, end: 17 }
          },
          quantumSignatureRequired: true,
          trustScoreMinimum: 60,
          mfaRequired: false,
          conditions: [],
          createdAt: new Date(),
          isActive: true,
          version: 1
        },
        {
          id: 'policy-003',
          name: 'High Security Resource',
          resource: 'confidential_data',
          allowedRoles: ['admin'],
          timeRestrictions: {
            days: [1, 2, 3, 4, 5],
            hours: { start: 8, end: 18 }
          },
          quantumSignatureRequired: true,
          trustScoreMinimum: 90,
          mfaRequired: true,
          conditions: [
            {
              type: 'trust_score',
              operator: 'greater_than',
              value: 90,
              required: true
            }
          ],
          createdAt: new Date(),
          isActive: true,
          version: 1
        }
      ];
      
      setPolicies(examplePolicies);
    } catch (error) {
      console.error('Error loading policies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blockchain policies',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePolicyStatus = async (policyId: string) => {
    try {
      setPolicies(prev => 
        prev.map(p => 
          p.id === policyId ? { ...p, isActive: !p.isActive } : p
        )
      );
      
      toast({
        title: 'Policy Updated',
        description: 'Policy status changed on blockchain',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update policy',
        variant: 'destructive'
      });
    }
  };

  const PolicyCard = ({ policy }: { policy: BlockchainPolicy }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {policy.name}
              <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                {policy.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Policy ID: {policy.id} • Version {policy.version}
            </CardDescription>
          </div>
          <Switch
            checked={policy.isActive}
            onCheckedChange={() => togglePolicyStatus(policy.id)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Resource</Label>
            <p className="font-medium">{policy.resource}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Allowed Roles</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {policy.allowedRoles.map(role => (
                <Badge key={role} variant="outline">{role}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Trust Score Min</Label>
            <p className="font-medium">{policy.trustScoreMinimum}%</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Security</Label>
            <div className="flex gap-1 mt-1">
              {policy.mfaRequired && (
                <Badge variant="secondary" className="text-xs">MFA</Badge>
              )}
              {policy.quantumSignatureRequired && (
                <Badge variant="secondary" className="text-xs">Quantum</Badge>
              )}
            </div>
          </div>
        </div>

        {policy.timeRestrictions && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Restrictions
            </Label>
            <p className="text-sm mt-1">
              Days: {policy.timeRestrictions.days.map(d => 
                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
              ).join(', ')}
              {' • '}
              Hours: {policy.timeRestrictions.hours.start}:00 - {policy.timeRestrictions.hours.end}:00
            </p>
          </div>
        )}

        {policy.conditions.length > 0 && (
          <div className="mt-4">
            <Label className="text-sm">Custom Conditions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {policy.conditions.map((condition, idx) => (
                <Badge key={idx} variant="outline">
                  {condition.type} {condition.operator} {condition.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const PolicyStats = () => {
    const activeCount = policies.filter(p => p.isActive).length;
    const highSecurityCount = policies.filter(p => p.trustScoreMinimum >= 80).length;
    const timeRestrictedCount = policies.filter(p => p.timeRestrictions).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              of {policies.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              High Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highSecurityCount}</div>
            <p className="text-xs text-muted-foreground">
              Trust score ≥80%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Time-Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeRestrictedCount}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled access
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Blockchain Policy Manager</h2>
          <p className="text-muted-foreground">
            Smart contract-like access control policies on blockchain
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Deploy Policy
        </Button>
      </div>

      <PolicyStats />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Policies</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Policies</TabsTrigger>
          <TabsTrigger value="all">All Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {policies.filter(p => p.isActive).map(policy => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {policies.filter(p => !p.isActive).map(policy => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {policies.map(policy => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

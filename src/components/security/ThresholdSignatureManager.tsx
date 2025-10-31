import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Key, Shield, CheckCircle2, Clock, Lock } from 'lucide-react';
import { ThresholdSignatureManager as TSManager, KeyShare } from '@/lib/threshold-signatures';
import { toast } from '@/hooks/use-toast';

export function ThresholdSignatureManager() {
  const [tsManager] = useState(() => new TSManager());
  const [threshold, setThreshold] = useState(3);
  const [totalShares, setTotalShares] = useState(5);
  const [keyShares, setKeyShares] = useState<KeyShare[]>([]);
  const [signatureRequest, setSignatureRequest] = useState<any>(null);
  const [partialSignatures, setPartialSignatures] = useState<number>(0);

  const handleGenerateKeys = () => {
    try {
      const participants = Array.from({ length: totalShares }, (_, i) => 
        `participant-${i + 1}`
      );

      const result = tsManager.generateKeyShares(
        'master-key-001',
        threshold,
        totalShares,
        participants
      );

      setKeyShares(result.keyShares);

      toast({
        title: 'Key Shares Generated',
        description: `Successfully generated ${totalShares} key shares (${threshold}-of-${totalShares} threshold)`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateSignatureRequest = () => {
    try {
      const request = tsManager.createSignatureRequest(
        'sig-req-001',
        'Critical Operation: Transfer Ownership',
        threshold
      );

      setSignatureRequest(request);
      setPartialSignatures(0);

      toast({
        title: 'Signature Request Created',
        description: `Requires ${threshold} signatures to complete`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddSignature = (shareId: number) => {
    try {
      const keyShare = keyShares.find(k => k.shareId === shareId);
      if (!keyShare) return;

      const result = tsManager.addPartialSignature(
        'sig-req-001',
        shareId,
        `participant-${shareId}`,
        keyShare
      );

      setPartialSignatures(prev => prev + 1);

      if (result.isComplete) {
        toast({
          title: 'Signature Complete',
          description: 'Threshold reached! Operation authorized.',
        });
        
        // Update signature request
        const updatedRequest = tsManager.getSignatureStatus('sig-req-001');
        setSignatureRequest(updatedRequest);
      } else {
        toast({
          title: 'Partial Signature Added',
          description: `${partialSignatures + 1} of ${threshold} signatures collected`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const stats = tsManager.getStatistics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Threshold Signature System</h2>
        <p className="text-muted-foreground">
          Multi-party signatures for critical operations - Requires M-of-N approvals
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-500" />
              Key Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_key_shares}</div>
            <p className="text-xs text-muted-foreground">Distributed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_signatures}</div>
            <p className="text-xs text-muted-foreground">Awaiting Signatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_signatures}</div>
            <p className="text-xs text-muted-foreground">Authorized</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Generate Distributed Key Shares
          </CardTitle>
          <CardDescription>
            Split master key into N shares, requiring M to sign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Threshold (M)</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min={2}
                max={totalShares}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum signatures required
              </p>
            </div>
            <div>
              <Label>Total Shares (N)</Label>
              <Input
                type="number"
                value={totalShares}
                onChange={(e) => setTotalShares(Number(e.target.value))}
                min={threshold}
                max={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total key share holders
              </p>
            </div>
          </div>

          <Button onClick={handleGenerateKeys}>
            <Key className="h-4 w-4 mr-2" />
            Generate {threshold}-of-{totalShares} Key Shares
          </Button>

          {keyShares.length > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Generated {keyShares.length} key shares.
                Distribute securely to participants.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Key Shares Display */}
      {keyShares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distributed Key Shares
            </CardTitle>
            <CardDescription>
              {threshold}-of-{totalShares} threshold scheme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {keyShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      {share.shareId}
                    </div>
                    <div>
                      <p className="font-medium">Share {share.shareId}</p>
                      <p className="text-xs text-muted-foreground">
                        Participant {share.shareId}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {threshold}/{totalShares} required
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Request */}
      {keyShares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Create Signature Request
            </CardTitle>
            <CardDescription>
              Initiate multi-party signing for critical operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleCreateSignatureRequest}>
              Create Signature Request
            </Button>

            {signatureRequest && (
              <div className="space-y-4 mt-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Operation:</strong> {signatureRequest.message}
                    <br />
                    <span className="text-xs">
                      Status: {signatureRequest.isComplete ? 'COMPLETED' : 'PENDING'} •
                      Signatures: {partialSignatures}/{threshold}
                    </span>
                  </AlertDescription>
                </Alert>

                {!signatureRequest.isComplete && (
                  <div className="space-y-2">
                    <Label>Add Signatures (Select share holders)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {keyShares.map((share) => (
                        <Button
                          key={share.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSignature(share.shareId)}
                        >
                          Sign #{share.shareId}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {signatureRequest.isComplete && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Operation Authorized
                    </h4>
                    <code className="block text-xs bg-background p-2 rounded break-all">
                      {signatureRequest.combinedSignature}
                    </code>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

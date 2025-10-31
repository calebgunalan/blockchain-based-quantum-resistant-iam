import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ZKProofManager, ZKProof } from '@/lib/zero-knowledge-proofs';
import { toast } from '@/hooks/use-toast';

export function ZeroKnowledgeAccessControl() {
  const [zkManager] = useState(() => new ZKProofManager());
  const [generatedProof, setGeneratedProof] = useState<ZKProof | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    try {
      // Simulate generating ZK proof
      const proof = await zkManager.generateProof({
        userId: 'user-123',
        resource: 'confidential_documents',
        action: 'read',
        trustScore: 85,
        roles: ['admin', 'viewer'],
        quantumSignature: 'quantum-sig-abc123'
      });

      setGeneratedProof(proof);

      // Generate anonymous token
      const token = await zkManager.generateAnonymousToken(proof);
      setAnonymousToken(token);

      toast({
        title: 'ZK Proof Generated',
        description: 'Zero-knowledge proof created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate proof',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!generatedProof) return;

    try {
      const result = await zkManager.verifyProof(
        generatedProof,
        'confidential_documents',
        'read'
      );

      setVerificationResult(result);

      toast({
        title: result.valid ? 'Proof Valid' : 'Proof Invalid',
        description: result.reason,
        variant: result.valid ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify proof',
        variant: 'destructive'
      });
    }
  };

  const stats = zkManager.getStatistics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Zero-Knowledge Access Control</h2>
        <p className="text-muted-foreground">
          Prove permissions without revealing identity - Privacy-first authentication
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Total Proofs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_proofs_generated}</div>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-purple-500" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_nullifiers}</div>
            <p className="text-xs text-muted-foreground">Anonymous</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-500" />
              Privacy Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Identity Hidden</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Zero-Knowledge Proofs (ZKP)</strong> allow you to prove you have access rights
          without revealing your identity, roles, or any sensitive information. This ensures
          maximum privacy while maintaining strong security guarantees.
        </AlertDescription>
      </Alert>

      {/* Generate Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Generate Anonymous Proof
          </CardTitle>
          <CardDescription>
            Create a zero-knowledge proof for accessing resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleGenerateProof} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate ZK Proof'}
            </Button>
            {generatedProof && (
              <Button onClick={handleVerifyProof} variant="outline">
                Verify Proof
              </Button>
            )}
          </div>

          {generatedProof && (
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Generated Proof Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resource Hash:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {generatedProof.publicInputs.resourceHash.substring(0, 16)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Action Hash:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {generatedProof.publicInputs.actionHash.substring(0, 16)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Trust Score:</span>
                    <Badge variant="outline">{generatedProof.publicInputs.minimumTrustScore}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nullifier:</span>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      {generatedProof.nullifier.substring(0, 16)}...
                    </code>
                  </div>
                </div>
              </div>

              {anonymousToken && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Anonymous Access Token
                  </h4>
                  <code className="block text-xs bg-background p-2 rounded break-all">
                    {anonymousToken}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use this token to access resources without revealing your identity
                  </p>
                </div>
              )}

              {verificationResult && (
                <Alert variant={verificationResult.valid ? 'default' : 'destructive'}>
                  {verificationResult.valid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <strong>Verification Result:</strong> {verificationResult.reason}
                    <br />
                    <span className="text-xs">
                      Risk Score: {verificationResult.riskScore}%
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Zero-Knowledge Proofs Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Commitment Phase</h4>
                <p className="text-sm text-muted-foreground">
                  Your identity, roles, and attributes are cryptographically committed (hidden)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Proof Generation</h4>
                <p className="text-sm text-muted-foreground">
                  A mathematical proof is generated showing you meet access requirements
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Verification</h4>
                <p className="text-sm text-muted-foreground">
                  The system verifies your proof without learning anything about you
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Anonymous Access</h4>
                <p className="text-sm text-muted-foreground">
                  Access granted without revealing your identity - complete privacy
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

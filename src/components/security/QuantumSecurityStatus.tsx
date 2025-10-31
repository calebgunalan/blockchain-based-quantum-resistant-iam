import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePostQuantumSecurity } from '@/hooks/usePostQuantumSecurity';
import { Shield, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function QuantumSecurityStatus() {
  const { pqEnabled, hybridMode, threatStatus, loading, enablePostQuantumSecurity, getMigrationPlan } = usePostQuantumSecurity();
  const [enabling, setEnabling] = useState(false);

  const handleEnablePQ = async () => {
    try {
      setEnabling(true);
      await enablePostQuantumSecurity('high');
      toast({
        title: "Quantum Security Activated",
        description: "Your account is now protected against quantum computer attacks using ML-KEM and ML-DSA algorithms.",
      });
    } catch (error) {
      console.error('Failed to enable PQ:', error);
    } finally {
      setEnabling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Assessing quantum security...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskColors = {
    low: 'bg-green-500/10 text-green-600 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-600 border-red-500/20'
  };

  const riskLevel = threatStatus?.overallRisk || 'unknown';

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quantum Security Status
              </CardTitle>
              <CardDescription>
                Protection against quantum computer attacks
              </CardDescription>
            </div>
            <Badge 
              variant={pqEnabled ? "default" : "destructive"}
              className="text-sm"
            >
              {pqEnabled ? (
                <><ShieldCheck className="h-3 w-3 mr-1" /> Protected</>
              ) : (
                <><ShieldAlert className="h-3 w-3 mr-1" /> Vulnerable</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pqEnabled ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Quantum Vulnerability Detected</AlertTitle>
              <AlertDescription>
                Your account uses classical encryption (RSA, ECDSA) which is vulnerable to quantum computers.
                Quantum computers with Shor's algorithm can break these in minutes.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-500/10 border-green-500/20">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Quantum Protection Active</AlertTitle>
              <AlertDescription className="text-green-600">
                Using {hybridMode ? 'hybrid' : 'post-quantum'} cryptography with ML-KEM and ML-DSA algorithms.
                Secure against both classical and quantum attacks.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Current Configuration</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Post-Quantum Crypto:</span>
                  <Badge variant={pqEnabled ? "default" : "secondary"}>
                    {pqEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hybrid Mode:</span>
                  <Badge variant={hybridMode ? "default" : "secondary"}>
                    {hybridMode ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {pqEnabled && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Algorithms:</span>
                    <span className="font-mono text-xs">ML-KEM-768, ML-DSA-65</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Threat Assessment</h4>
              {threatStatus && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <Badge className={riskColors[riskLevel as keyof typeof riskColors]}>
                      {riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vulnerable Operations:</span>
                    <span className="font-semibold">{threatStatus.vulnerableOperations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Assessment:</span>
                    <span className="text-xs">{new Date(threatStatus.lastAssessment).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!pqEnabled && (
            <div className="pt-4 border-t">
              <Button onClick={handleEnablePQ} disabled={enabling} className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                {enabling ? 'Enabling Quantum Protection...' : 'Enable Quantum Security Now'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This will generate new quantum-resistant keys and enable hybrid encryption
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      {threatStatus && threatStatus.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {threatStatus.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Technical Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Quantum Security Matters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <h4 className="font-semibold text-foreground mb-1">The Quantum Threat</h4>
            <p>
              Quantum computers with Shor's algorithm can break RSA-2048 encryption in hours. 
              Classical algorithms like ECDSA and RSA are fundamentally vulnerable.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Our Solution</h4>
            <p>
              We use NIST-approved post-quantum algorithms (ML-KEM, ML-DSA) based on lattice cryptography.
              These are resistant to both classical and quantum attacks.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Hybrid Protection</h4>
            <p>
              Hybrid mode combines classical + post-quantum crypto. Your data is secure even if one algorithm is compromised.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

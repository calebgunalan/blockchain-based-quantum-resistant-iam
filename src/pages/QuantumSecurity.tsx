import { QuantumSecurityDashboard } from '@/components/security/QuantumSecurityDashboard';
import { QuantumSecurityStatus } from '@/components/security/QuantumSecurityStatus';
import { EnterpriseQuantumDashboard } from '@/components/security/EnterpriseQuantumDashboard';
import { QuantumCertificateManager } from '@/components/security/QuantumCertificateManager';
import { TrustScoreDetails } from '@/components/TrustScoreDetails';
import { QuantumAccessGate } from '@/components/security/QuantumAccessGate';
import { AttackReportViewer } from '@/components/security/AttackReportViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Lock, Zap, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function QuantumSecurity() {
  return (
    <QuantumAccessGate requiredPermission="view">
      <div className="container mx-auto p-6 space-y-6">
        {/* Critical Security Notice */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Assessment Required!</strong> Enable post-quantum protection to secure against quantum computer attacks. 
            Current systems using classical cryptography are vulnerable to "harvest now, decrypt later" attacks.
          </AlertDescription>
        </Alert>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Quantum Security Overview
            </CardTitle>
            <CardDescription>
              Understanding how quantum-resistant cryptography protects your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Key className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Post-Quantum Key Exchange</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses CRYSTALS-Kyber (ML-KEM) algorithm for key encapsulation, protecting against future quantum computer attacks
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Lock className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Quantum-Safe Signatures</h4>
                  <p className="text-sm text-muted-foreground">
                    CRYSTALS-Dilithium (ML-DSA) provides tamper-proof digital signatures resistant to quantum attacks
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Attack Detection & Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time detection of quantum and classical attack vectors with automated blocking
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold text-sm">Zero-Trust Architecture</h4>
                  <p className="text-sm text-muted-foreground">
                    Continuous verification with trust scoring and risk-based access control
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="basic">Basic Security</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="trust">Trust Analysis</TabsTrigger>
            <TabsTrigger value="attacks">Attack Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <QuantumSecurityStatus />
          </TabsContent>
          
          <TabsContent value="basic" className="space-y-4">
            <QuantumSecurityDashboard />
          </TabsContent>
          
          <TabsContent value="certificates" className="space-y-4">
            <QuantumAccessGate requiredPermission="manage">
              <QuantumCertificateManager />
            </QuantumAccessGate>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <QuantumAccessGate requiredPermission="configure">
              <EnterpriseQuantumDashboard />
            </QuantumAccessGate>
          </TabsContent>
          
          <TabsContent value="trust" className="space-y-4">
            <TrustScoreDetails />
          </TabsContent>

          <TabsContent value="attacks" className="space-y-4">
            <AttackReportViewer />
          </TabsContent>
        </Tabs>
      </div>
    </QuantumAccessGate>
  );
}

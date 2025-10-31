import { QuantumControlCenter } from '@/components/admin/QuantumControlCenter';
import { QuantumSecurityStatus } from '@/components/security/QuantumSecurityStatus';
import { AdminGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Atom, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuantumControl() {
  const navigate = useNavigate();

  return (
    <AdminGate>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Atom className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Quantum Security Administration</h1>
          </div>
          <p className="text-muted-foreground">
            Master control panel for quantum-resistant encryption, key management, and security demonstrations.
            Toggle quantum protection on/off to test security differences and view all hidden quantum features.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">
              <Shield className="h-4 w-4 mr-2" />
              Security Overview
            </TabsTrigger>
            <TabsTrigger value="control">
              <Atom className="h-4 w-4 mr-2" />
              Control Center
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <QuantumSecurityStatus />
          </TabsContent>
          
          <TabsContent value="control">
            <QuantumControlCenter />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZeroKnowledgeAccessControl } from '@/components/security/ZeroKnowledgeAccessControl';
import { ThresholdSignatureManager } from '@/components/security/ThresholdSignatureManager';
import { CrossChainIdentityManager } from '@/components/security/CrossChainIdentityManager';
import { Shield, EyeOff, Users, Globe } from 'lucide-react';

export default function AdvancedSecurity() {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Advanced Security Features</h1>
          </div>
          <p className="text-muted-foreground">
            Zero-knowledge proofs, threshold signatures, and privacy-preserving authentication
          </p>
        </div>

        <Tabs defaultValue="zk" className="space-y-6">
          <TabsList>
            <TabsTrigger value="zk">
              <EyeOff className="h-4 w-4 mr-2" />
              Zero-Knowledge Proofs
            </TabsTrigger>
            <TabsTrigger value="threshold">
              <Users className="h-4 w-4 mr-2" />
              Threshold Signatures
            </TabsTrigger>
            <TabsTrigger value="crosschain">
              <Globe className="h-4 w-4 mr-2" />
              Cross-Chain Identity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zk">
            <ZeroKnowledgeAccessControl />
          </TabsContent>

          <TabsContent value="threshold">
            <ThresholdSignatureManager />
          </TabsContent>

          <TabsContent value="crosschain">
            <CrossChainIdentityManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

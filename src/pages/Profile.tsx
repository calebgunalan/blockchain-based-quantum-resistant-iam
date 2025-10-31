import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MFASetup } from "@/components/security/MFASetup";
import { APIKeyManagement } from "@/components/security/APIKeyManagement";
import { APIKeyInstructions } from "@/components/security/APIKeyInstructions";
import { SessionSettings } from "@/components/security/SessionSettings";
import { TrustScoreDetails } from "@/components/TrustScoreDetails";
import { TimeBasedPermissions } from "@/components/security/TimeBasedPermissions";
import { ComprehensiveRiskAssessment } from "@/components/security/ComprehensiveRiskAssessment";
import { ApprovalRequestManager } from "@/components/security/ApprovalRequestManager";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { UserGroupMemberships } from "@/components/UserGroupMemberships";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold">Profile & Security</h1>
          <p className="text-muted-foreground">Manage your account security settings and access controls</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
            {userRole !== 'admin' && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileEditForm />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <MFASetup />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <APIKeyInstructions />
            <APIKeyManagement />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionSettings />
          </TabsContent>

          <TabsContent value="risk-analysis" className="space-y-6">
            <ComprehensiveRiskAssessment />
            <TrustScoreDetails />
          </TabsContent>

          {userRole !== 'admin' && (
            <TabsContent value="approvals" className="space-y-6">
              <ApprovalRequestManager />
            </TabsContent>
          )}

          <TabsContent value="groups" className="space-y-6">
            <UserGroupMemberships />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <TrustScoreDetails />
            <TimeBasedPermissions />
          </TabsContent>
        </Tabs>
    </div>
  );
}
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MFAEnforcement } from "@/components/security/MFAEnforcement";
import { Shield } from "lucide-react";
import { MFAInfoDialog, QuantumSecurityInfoDialog } from "@/components/security/InfoDialogs";

export default function MFAManagement() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            MFA Enforcement Management
            <MFAInfoDialog />
            <QuantumSecurityInfoDialog />
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure multi-factor authentication requirements for different user roles
          </p>
        </div>

        <div className="grid gap-6">
          <MFAEnforcement userRole="admin" />
          <MFAEnforcement userRole="moderator" />
          <MFAEnforcement userRole="user" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>MFA Compliance Overview</CardTitle>
            <CardDescription>
              View MFA enrollment status across your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              MFA compliance reporting will be available in the next update.
              Currently, you can enforce MFA requirements per role above.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

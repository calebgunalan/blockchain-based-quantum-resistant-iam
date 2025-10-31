import { AccountLockoutManager } from "@/components/security/AccountLockoutManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AccountLockouts() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Account Lockout Management</h1>
          <p className="text-muted-foreground">
            Manage account lockouts and failed login attempts
          </p>
        </div>
      </div>

      <AccountLockoutManager />
    </div>
  );
}

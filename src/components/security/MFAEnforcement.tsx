import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MFAEnforcementProps {
  userRole?: string;
}

export function MFAEnforcement({ userRole = "user" }: MFAEnforcementProps) {
  const [mfaRequired, setMfaRequired] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMFASettings();
  }, [userRole]);

  const loadMFASettings = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("mfa_required, mfa_grace_period_days")
      .eq("role", userRole as any)
      .maybeSingle();

    if (data) {
      setMfaRequired(data.mfa_required || false);
      setGracePeriodDays(data.mfa_grace_period_days || 7);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .update({
        mfa_required: mfaRequired,
        mfa_grace_period_days: gracePeriodDays,
      })
      .eq("role", userRole as any);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update MFA enforcement settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings updated",
        description: "MFA enforcement settings have been updated",
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          MFA Enforcement for {userRole}
        </CardTitle>
        <CardDescription>
          Configure multi-factor authentication requirements for this role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mfaRequired && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Users with this role will be required to enable MFA within the grace period
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mfa-required">Require MFA</Label>
            <p className="text-sm text-muted-foreground">
              Force users to enable multi-factor authentication
            </p>
          </div>
          <Switch
            id="mfa-required"
            checked={mfaRequired}
            onCheckedChange={setMfaRequired}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grace-period">Grace Period (days)</Label>
          <Input
            id="grace-period"
            type="number"
            min={1}
            max={90}
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(parseInt(e.target.value))}
            disabled={!mfaRequired}
          />
          <p className="text-sm text-muted-foreground">
            Time allowed for users to set up MFA after being assigned this role
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          <Key className="h-4 w-4 mr-2" />
          Save MFA Settings
        </Button>
      </CardContent>
    </Card>
  );
}

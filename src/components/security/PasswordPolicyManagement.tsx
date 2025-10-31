import { useState } from "react";
import { usePasswordPolicies } from "@/hooks/usePasswordPolicies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

export function PasswordPolicyManagement() {
  const { policy, loading, updatePolicy } = usePasswordPolicies();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    min_length: policy?.min_length || 8,
    require_uppercase: policy?.require_uppercase || true,
    require_lowercase: policy?.require_lowercase || true,
    require_numbers: policy?.require_numbers || true,
    require_special_chars: policy?.require_special_chars || true,
    max_age_days: policy?.max_age_days || 90,
    prevent_reuse_count: policy?.prevent_reuse_count || 5,
    lockout_threshold: policy?.lockout_threshold || 5,
    lockout_duration_minutes: policy?.lockout_duration_minutes || 30
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePolicy(formData);
      toast({ title: "Policy updated", description: "Password policy has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Policy Management</CardTitle>
        <CardDescription>Configure organization-wide password requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min_length">Minimum Password Length</Label>
            <Input
              id="min_length"
              type="number"
              min="6"
              max="128"
              value={formData.min_length}
              onChange={(e) => setFormData({ ...formData, min_length: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="uppercase">Require Uppercase Letters</Label>
            <Switch
              id="uppercase"
              checked={formData.require_uppercase}
              onCheckedChange={(checked) => setFormData({ ...formData, require_uppercase: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lowercase">Require Lowercase Letters</Label>
            <Switch
              id="lowercase"
              checked={formData.require_lowercase}
              onCheckedChange={(checked) => setFormData({ ...formData, require_lowercase: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="numbers">Require Numbers</Label>
            <Switch
              id="numbers"
              checked={formData.require_numbers}
              onCheckedChange={(checked) => setFormData({ ...formData, require_numbers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="special">Require Special Characters</Label>
            <Switch
              id="special"
              checked={formData.require_special_chars}
              onCheckedChange={(checked) => setFormData({ ...formData, require_special_chars: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_age">Password Expiration (days)</Label>
            <Input
              id="max_age"
              type="number"
              min="0"
              max="365"
              value={formData.max_age_days}
              onChange={(e) => setFormData({ ...formData, max_age_days: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Set to 0 to disable password expiration</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prevent_reuse">Prevent Password Reuse (last N passwords)</Label>
            <Input
              id="prevent_reuse"
              type="number"
              min="0"
              max="24"
              value={formData.prevent_reuse_count}
              onChange={(e) => setFormData({ ...formData, prevent_reuse_count: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockout_threshold">Account Lockout Threshold (failed attempts)</Label>
            <Input
              id="lockout_threshold"
              type="number"
              min="3"
              max="10"
              value={formData.lockout_threshold}
              onChange={(e) => setFormData({ ...formData, lockout_threshold: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
            <Input
              id="lockout_duration"
              type="number"
              min="5"
              max="1440"
              value={formData.lockout_duration_minutes}
              onChange={(e) => setFormData({ ...formData, lockout_duration_minutes: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Password Policy
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useAccountLockout } from "@/hooks/useAccountLockout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function AccountLockoutManager() {
  const { lockouts, failedAttempts, loading, unlockAccount, manualLockAccount } = useAccountLockout();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState("30min");
  const [reason, setReason] = useState("");

  const handleManualLock = async () => {
    if (!email || !reason) {
      toast({
        title: "Missing information",
        description: "Please provide email and reason",
        variant: "destructive",
      });
      return;
    }

    try {
      await manualLockAccount(email, duration, reason);
      toast({
        title: "Account locked",
        description: `Account ${email} has been locked`,
      });
      setEmail("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Lock failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnlock = async (lockoutId: string) => {
    try {
      await unlockAccount(lockoutId);
      toast({
        title: "Account unlocked",
        description: "The account has been unlocked",
      });
    } catch (error: any) {
      toast({
        title: "Unlock failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeLockouts = lockouts.filter(l => l.is_active && new Date(l.unlock_at) > new Date());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Manual Account Lockout
          </CardTitle>
          <CardDescription>
            Manually lock an account for security reasons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Lock Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30 Minutes</SelectItem>
                <SelectItem value="1hour">1 Hour</SelectItem>
                <SelectItem value="24hours">24 Hours</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Reason for locking account..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleManualLock} className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Lock Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Lockouts ({activeLockouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeLockouts.length === 0 ? (
            <p className="text-muted-foreground">No active lockouts</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Locked At</TableHead>
                  <TableHead>Unlock At</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLockouts.map((lockout) => (
                  <TableRow key={lockout.id}>
                    <TableCell className="font-mono text-sm">{lockout.email}</TableCell>
                    <TableCell>{format(new Date(lockout.locked_at), 'PPp')}</TableCell>
                    <TableCell>{format(new Date(lockout.unlock_at), 'PPp')}</TableCell>
                    <TableCell className="max-w-xs truncate">{lockout.reason}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlock(lockout.id)}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Failed Login Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : failedAttempts.length === 0 ? (
            <p className="text-muted-foreground">No failed attempts recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedAttempts.slice(0, 20).map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-mono text-sm">{attempt.email}</TableCell>
                    <TableCell>{format(new Date(attempt.attempt_timestamp), 'PPp')}</TableCell>
                    <TableCell className="font-mono text-sm">{attempt.ip_address || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{attempt.user_agent || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

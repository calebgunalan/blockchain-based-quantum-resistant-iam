import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface IPRule {
  id: string;
  name: string;
  rule_type: string;
  ip_address: string | null;
  ip_range: string | null;
  is_active: boolean;
  applies_to: string;
  created_at: string;
}

export function IPAccessManagement() {
  const [rules, setRules] = useState<IPRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<"whitelist" | "blacklist">("whitelist");
  const [ipAddress, setIpAddress] = useState("");
  const [appliesTo, setAppliesTo] = useState<"all" | "user">("all");
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const { data } = await supabase
      .from("ip_access_rules")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setRules(data as IPRule[]);
    }
  };

  const handleAddRule = async () => {
    if (!name || !ipAddress) {
      toast({
        title: "Missing fields",
        description: "Please provide a name and IP address/range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Determine if it's a single IP or CIDR range
    const isCIDR = ipAddress.includes("/");
    
    const insertData: any = {
      name,
      rule_type: ruleType,
      applies_to: appliesTo,
      is_active: true,
    };
    
    if (isCIDR) {
      insertData.ip_range = ipAddress;
    } else {
      insertData.ip_address = ipAddress;
    }
    
    const { error } = await supabase
      .from("ip_access_rules")
      .insert(insertData);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rule added",
        description: "IP access rule has been created successfully",
      });
      setName("");
      setIpAddress("");
      loadRules();
    }
    setLoading(false);
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase
      .from("ip_access_rules")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rule deleted",
        description: "IP access rule has been removed",
      });
      loadRules();
    }
  };

  const handleToggleRule = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ip_access_rules")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
    } else {
      loadRules();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Add IP Access Rule
          </CardTitle>
          <CardDescription>
            Create whitelist or blacklist rules for IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Office Network"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-type">Rule Type</Label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v as "whitelist" | "blacklist")}>
                <SelectTrigger id="rule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelist">Whitelist (Allow)</SelectItem>
                  <SelectItem value="blacklist">Blacklist (Block)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address or CIDR Range</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1 or 192.168.1.0/24"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applies-to">Applies To</Label>
              <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as "all" | "user")}>
                <SelectTrigger id="applies-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="user">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAddRule} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP Access Rules</CardTitle>
          <CardDescription>
            Manage existing IP whitelist and blacklist rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP/Range</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant={rule.rule_type === "whitelist" ? "default" : "destructive"}>
                      {rule.rule_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {rule.ip_address || rule.ip_range}
                  </TableCell>
                  <TableCell>{rule.applies_to}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

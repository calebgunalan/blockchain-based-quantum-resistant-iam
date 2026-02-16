import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface MigrationStatus {
  id: string;
  user_id: string;
  current_algorithm: string;
  target_algorithm: string;
  migration_stage: string;
  dual_mode_enabled: boolean;
  legacy_keys_count: number;
  pqc_keys_count: number;
  started_at: string;
  completed_at: string | null;
}

const STAGE_COLORS: Record<string, string> = {
  pending: "hsl(var(--muted-foreground))",
  dual_mode: "hsl(45 93% 47%)",
  transitioning: "hsl(221 83% 53%)",
  completed: "hsl(142 76% 36%)",
  failed: "hsl(0 84% 60%)",
};

const STAGE_LABELS: Record<string, string> = {
  pending: "Pending",
  dual_mode: "Dual Mode",
  transitioning: "Transitioning",
  completed: "Completed",
  failed: "Failed",
};

export default function CryptoMigration() {
  const [migrations, setMigrations] = useState<MigrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMigrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pqc_migration_status")
      .select("*")
      .order("started_at", { ascending: false });

    if (!error && data) {
      setMigrations(data as unknown as MigrationStatus[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMigrations();
  }, []);

  // Aggregate stats
  const total = migrations.length;
  const completed = migrations.filter((m) => m.migration_stage === "completed").length;
  const inProgress = migrations.filter((m) => ["dual_mode", "transitioning"].includes(m.migration_stage)).length;
  const pending = migrations.filter((m) => m.migration_stage === "pending").length;
  const failed = migrations.filter((m) => m.migration_stage === "failed").length;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const totalLegacy = migrations.reduce((s, m) => s + (m.legacy_keys_count || 0), 0);
  const totalPqc = migrations.reduce((s, m) => s + (m.pqc_keys_count || 0), 0);
  const totalKeys = totalLegacy + totalPqc;

  const pieData = [
    { name: "PQC Keys", value: totalPqc || 1 },
    { name: "Legacy Keys", value: totalLegacy || 1 },
  ];
  const PIE_COLORS = ["hsl(142 76% 36%)", "hsl(0 84% 60%)"];

  const stageData = Object.entries(
    migrations.reduce<Record<string, number>>((acc, m) => {
      acc[m.migration_stage] = (acc[m.migration_stage] || 0) + 1;
      return acc;
    }, {})
  ).map(([stage, count]) => ({ stage: STAGE_LABELS[stage] || stage, count }));

  const handleMigrateAll = async () => {
    const pendingIds = migrations.filter((m) => m.migration_stage === "pending").map((m) => m.id);
    if (pendingIds.length === 0) {
      toast.info("No pending migrations to start");
      return;
    }
    const { error } = await supabase
      .from("pqc_migration_status")
      .update({ migration_stage: "dual_mode", dual_mode_enabled: true })
      .in("id", pendingIds);

    if (error) {
      toast.error("Failed to start migrations");
    } else {
      toast.success(`Started ${pendingIds.length} migrations`);
      fetchMigrations();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crypto Migration Dashboard</h1>
          <p className="text-muted-foreground mt-1">Classical → Post-Quantum Cryptography migration status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMigrations}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={handleMigrateAll}>
            <ArrowRight className="h-4 w-4 mr-1" /> Migrate All Pending
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl">{overallProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-5 w-5 text-primary" /> {completed}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">of {total} users</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-5 w-5 text-accent-foreground" /> {inProgress}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">{pending} pending</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Key Distribution</CardDescription>
            <CardTitle className="text-2xl">{totalKeys}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {totalPqc} PQC / {totalLegacy} legacy
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Per-User Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Key Type Distribution</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Migration Stages</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <XAxis dataKey="stage" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Current → Target</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Legacy Keys</TableHead>
                    <TableHead>PQC Keys</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {loading ? "Loading..." : "No migration records found"}
                      </TableCell>
                    </TableRow>
                  )}
                  {migrations.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-sm">{m.current_algorithm} → {m.target_algorithm}</TableCell>
                      <TableCell>
                        <Badge
                          variant={m.migration_stage === "completed" ? "default" : m.migration_stage === "failed" ? "destructive" : "secondary"}
                        >
                          {STAGE_LABELS[m.migration_stage] || m.migration_stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{m.legacy_keys_count}</TableCell>
                      <TableCell>{m.pqc_keys_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.started_at ? new Date(m.started_at).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

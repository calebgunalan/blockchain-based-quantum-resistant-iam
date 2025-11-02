import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Zap, Clock, TrendingUp } from 'lucide-react';

export function PerformanceMonitor() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('performance_benchmarks')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setBenchmarks(data);
    }
    
    setLoading(false);
  };

  const aggregateBenchmarks = () => {
    const byOperation: Record<string, any> = {};

    benchmarks.forEach(b => {
      if (!byOperation[b.operation_type]) {
        byOperation[b.operation_type] = {
          operation: b.operation_type,
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        };
      }

      const op = byOperation[b.operation_type];
      op.count++;
      op.totalDuration += b.duration_ms;
      op.minDuration = Math.min(op.minDuration, b.duration_ms);
      op.maxDuration = Math.max(op.maxDuration, b.duration_ms);
    });

    Object.values(byOperation).forEach((op: any) => {
      op.avgDuration = op.totalDuration / op.count;
    });

    return Object.values(byOperation);
  };

  const prepareChartData = () => {
    const recent = benchmarks.slice(0, 20).reverse();
    return recent.map(b => ({
      time: new Date(b.recorded_at).toLocaleTimeString(),
      duration: b.duration_ms,
      operation: b.operation_type
    }));
  };

  const stats = aggregateBenchmarks();
  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Performance Monitor</h2>
        <p className="text-muted-foreground">
          System performance metrics and benchmarks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarks.length}</div>
            <p className="text-xs text-muted-foreground">
              Recorded benchmarks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operation Types</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {benchmarks.length > 0
                ? Math.round(benchmarks.reduce((sum, b) => sum + b.duration_ms, 0) / benchmarks.length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              All operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Duration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {benchmarks.length > 0
                ? Math.round(Math.max(...benchmarks.map(b => b.duration_ms)))
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum observed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Recent operation durations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operation Statistics</CardTitle>
          <CardDescription>Performance breakdown by operation type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.operation} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{stat.operation}</h4>
                  <span className="text-sm text-muted-foreground">
                    {stat.count} operations
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Average</p>
                    <p className="font-medium">{Math.round(stat.avgDuration)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Minimum</p>
                    <p className="font-medium">{Math.round(stat.minDuration)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Maximum</p>
                    <p className="font-medium">{Math.round(stat.maxDuration)}ms</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

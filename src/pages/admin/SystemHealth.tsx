import Layout from '@/components/Layout';
import { SystemHealthOverview } from '@/components/admin/SystemHealthOverview';
import { LiveMonitoringDashboard } from '@/components/admin/LiveMonitoringDashboard';
import { PerformanceMonitor } from '@/components/admin/PerformanceMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const SystemHealth = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Health & Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of blockchain, P2P network, and quantum security systems
          </p>
        </div>

        <SystemHealthOverview />

        <Tabs defaultValue="monitoring" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Monitoring
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts & Incidents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            <LiveMonitoringDashboard />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceMonitor />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Alert management interface - detailed view of all system alerts
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SystemHealth;

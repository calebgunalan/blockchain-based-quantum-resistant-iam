import { useState, useEffect } from 'react';
import { RealTimeMonitoring } from '@/lib/real-time-monitoring';
import { toast } from 'sonner';

export const useSystemAlerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data = await RealTimeMonitoring.getUnacknowledgedAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const success = await RealTimeMonitoring.acknowledgeAlert(alertId);
      if (success) {
        toast.success('Alert acknowledged');
        await fetchAlerts();
      } else {
        toast.error('Failed to acknowledge alert');
      }
      return success;
    } catch (error) {
      toast.error('Error acknowledging alert');
      return false;
    }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    loading,
    acknowledgeAlert,
    refresh: fetchAlerts
  };
};

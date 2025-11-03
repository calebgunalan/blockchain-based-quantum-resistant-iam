import { useState, useEffect } from 'react';
import { RealTimeMonitoring, IncidentReport } from '@/lib/real-time-monitoring';
import { toast } from 'sonner';

export const useIncidentManagement = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const data = await RealTimeMonitoring.getRecentIncidents(50);
      setIncidents(data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const createIncident = async (incident: IncidentReport) => {
    try {
      const id = await RealTimeMonitoring.createIncident(incident);
      if (id) {
        toast.success('Incident created successfully');
        await fetchIncidents();
        return id;
      } else {
        toast.error('Failed to create incident');
        return null;
      }
    } catch (error) {
      toast.error('Error creating incident');
      return null;
    }
  };

  const updateStatus = async (
    incidentId: string,
    status: 'open' | 'investigating' | 'resolved' | 'closed',
    resolutionNotes?: string
  ) => {
    try {
      const success = await RealTimeMonitoring.updateIncidentStatus(
        incidentId,
        status,
        resolutionNotes
      );
      if (success) {
        toast.success('Incident status updated');
        await fetchIncidents();
      } else {
        toast.error('Failed to update incident');
      }
      return success;
    } catch (error) {
      toast.error('Error updating incident');
      return false;
    }
  };

  return {
    incidents,
    loading,
    createIncident,
    updateStatus,
    refresh: fetchIncidents
  };
};

import { useState } from 'react';
import { 
  AdaptiveMFAManager, 
  AuthContext, 
  RiskAssessment,
  MFAMethod
} from '@/lib/adaptive-mfa';
import { toast } from '@/hooks/use-toast';

export function useAdaptiveMFA() {
  const [manager] = useState(() => new AdaptiveMFAManager());
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  const assessRisk = async (context: AuthContext): Promise<RiskAssessment> => {
    try {
      setLoading(true);
      const assessment = await manager.calculateMFARequirement(context);
      setRiskAssessment(assessment);
      return assessment;
    } catch (error) {
      console.error('Error assessing risk:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async (userId: string, method: MFAMethod) => {
    try {
      const challenge = await manager.createMFAChallenge(userId, method);
      
      toast({
        title: 'MFA Challenge Created',
        description: `Verification code sent via ${method}`
      });

      return challenge;
    } catch (error) {
      console.error('Error creating MFA challenge:', error);
      toast({
        title: 'Challenge Failed',
        description: 'Failed to create MFA challenge',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const verifyChallenge = async (challengeId: string, token: string, userId: string) => {
    try {
      const result = await manager.verifyMFAChallenge(challengeId, token, userId);
      
      if (result.success) {
        toast({
          title: 'Verification Successful',
          description: result.message
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: result.message,
          variant: 'destructive'
        });
      }

      return result;
    } catch (error) {
      console.error('Error verifying challenge:', error);
      toast({
        title: 'Verification Error',
        description: 'An error occurred during verification',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const getMFAHistory = async (userId: string, limit?: number) => {
    try {
      return await manager.getMFAHistory(userId, limit);
    } catch (error) {
      console.error('Error fetching MFA history:', error);
      return [];
    }
  };

  return {
    riskAssessment,
    loading,
    assessRisk,
    createChallenge,
    verifyChallenge,
    getMFAHistory
  };
}

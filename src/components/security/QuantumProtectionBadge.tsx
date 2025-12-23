import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, ShieldCheck, ChevronRight, Settings } from 'lucide-react';
import { usePostQuantumSecurity } from '@/hooks/usePostQuantumSecurity';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function QuantumProtectionBadge() {
  const { pqEnabled, threatStatus, loading } = usePostQuantumSecurity();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return null;
  }

  const getVariant = () => {
    if (!pqEnabled) return 'destructive';
    if (threatStatus?.overallRisk === 'critical' || threatStatus?.overallRisk === 'high') {
      return 'destructive';
    }
    if (threatStatus?.overallRisk === 'medium') return 'secondary';
    return 'default';
  };

  const getIcon = () => {
    if (!pqEnabled) return <ShieldAlert className="h-3 w-3" />;
    if (threatStatus?.overallRisk === 'critical' || threatStatus?.overallRisk === 'high') {
      return <ShieldAlert className="h-3 w-3" />;
    }
    return <ShieldCheck className="h-3 w-3" />;
  };

  const getLabel = () => {
    if (!pqEnabled) return 'Quantum Vulnerable';
    if (threatStatus?.overallRisk === 'critical') return 'Critical Risk';
    if (threatStatus?.overallRisk === 'high') return 'High Risk';
    if (threatStatus?.overallRisk === 'medium') return 'Medium Risk';
    return 'Quantum Protected';
  };

  const getDetailedInfo = () => {
    if (!pqEnabled) {
      return {
        title: 'Quantum Vulnerability Detected',
        status: 'VULNERABLE',
        statusColor: 'text-destructive',
        reasons: [
          'Post-quantum cryptography is not enabled',
          'Your keys are vulnerable to Shor\'s algorithm',
          'Session encryption uses classical algorithms only',
          'Digital signatures can be forged by quantum computers'
        ],
        actions: [
          { label: 'Enable Quantum Protection', action: () => navigate('/quantum-security') },
          { label: 'Learn More', action: () => navigate('/quantum-security') }
        ],
        impact: 'Your identity and access credentials could be compromised when large-scale quantum computers become available.'
      };
    }

    if (threatStatus?.overallRisk === 'critical' || threatStatus?.overallRisk === 'high') {
      return {
        title: 'High Security Risk Detected',
        status: threatStatus?.overallRisk?.toUpperCase() || 'HIGH RISK',
        statusColor: 'text-destructive',
        reasons: [
          `${threatStatus?.vulnerableOperations || 0} vulnerable operations detected`,
          'Some cryptographic operations are not quantum-safe',
          'Key rotation may be overdue',
          ...(threatStatus?.recommendations?.slice(0, 2) || [])
        ],
        actions: [
          { label: 'View Security Dashboard', action: () => navigate('/quantum-security') },
          { label: 'Rotate Keys', action: () => navigate('/admin/quantum-control') }
        ],
        impact: 'Some operations are still vulnerable. Immediate action recommended to ensure full protection.'
      };
    }

    if (threatStatus?.overallRisk === 'medium') {
      return {
        title: 'Partial Protection Active',
        status: 'MEDIUM RISK',
        statusColor: 'text-yellow-500',
        reasons: [
          'Quantum protection is partially enabled',
          'Some legacy operations may use classical crypto',
          'Key strength could be improved'
        ],
        actions: [
          { label: 'Upgrade Protection', action: () => navigate('/quantum-security') }
        ],
        impact: 'Your account has basic protection but could benefit from additional security measures.'
      };
    }

    return {
      title: 'Full Quantum Protection Active',
      status: 'PROTECTED',
      statusColor: 'text-green-500',
      reasons: [
        'ML-KEM-1024 key encapsulation active',
        'ML-DSA-87 digital signatures enabled',
        'Quantum-safe session encryption',
        'All operations use post-quantum algorithms'
      ],
      actions: [
        { label: 'View Details', action: () => navigate('/quantum-security') }
      ],
      impact: 'Your identity is protected against both classical and quantum computer attacks.'
    };
  };

  const info = getDetailedInfo();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge variant={getVariant()} className="gap-1 cursor-pointer hover:opacity-80 transition-opacity">
          {getIcon()}
          {getLabel()}
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!pqEnabled || threatStatus?.overallRisk === 'high' || threatStatus?.overallRisk === 'critical' 
              ? <ShieldAlert className="h-5 w-5 text-destructive" />
              : <ShieldCheck className="h-5 w-5 text-green-500" />
            }
            {info.title}
          </DialogTitle>
          <DialogDescription>
            Current Status: <span className={`font-semibold ${info.statusColor}`}>{info.status}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Why this status?</h4>
            <ul className="space-y-1">
              {info.reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-1">Impact</h4>
            <p className="text-sm text-muted-foreground">{info.impact}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recommended Actions</h4>
            {info.actions.map((action, idx) => (
              <Button
                key={idx}
                variant={idx === 0 ? 'default' : 'outline'}
                className="w-full justify-between"
                onClick={action.action}
              >
                {action.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

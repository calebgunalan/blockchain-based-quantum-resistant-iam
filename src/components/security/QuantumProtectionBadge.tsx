import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { usePostQuantumSecurity } from '@/hooks/usePostQuantumSecurity';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function QuantumProtectionBadge() {
  const { pqEnabled, threatStatus, loading } = usePostQuantumSecurity();
  const [mounted, setMounted] = useState(false);

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

  const getDescription = () => {
    if (!pqEnabled) {
      return 'Your account is vulnerable to quantum computer attacks. Enable post-quantum security in settings.';
    }
    
    if (threatStatus) {
      return `Risk Level: ${threatStatus.overallRisk.toUpperCase()}\n${threatStatus.vulnerableOperations} vulnerable operations detected\n\nRecommendations:\n${threatStatus.recommendations.slice(0, 3).join('\n')}`;
    }

    return 'Your account is protected with post-quantum cryptography.';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant()} className="gap-1 cursor-help">
            {getIcon()}
            {getLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-wrap">
          <p className="text-sm">{getDescription()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { ReactNode } from "react";
import { useQuantumPermissions } from "@/hooks/useQuantumPermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantumAccessGateProps {
  children: ReactNode;
  requiredPermission: 'view' | 'manage' | 'configure';
  fallback?: ReactNode;
}

export function QuantumAccessGate({ 
  children, 
  requiredPermission, 
  fallback 
}: QuantumAccessGateProps) {
  const { hasViewAccess, hasManageAccess, hasConfigureAccess, loading } = useQuantumPermissions();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 animate-pulse" />
            <span>Checking quantum security permissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPermission = () => {
    switch (requiredPermission) {
      case 'view':
        return hasViewAccess;
      case 'manage':
        return hasManageAccess;
      case 'configure':
        return hasConfigureAccess;
      default:
        return false;
    }
  };

  if (!hasPermission()) {
    return fallback || (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            You don't have the required quantum security permissions to access this feature. 
            Contact your administrator to request access.
          </p>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span>Required permission: {requiredPermission.toUpperCase()}</span>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.href = '/dashboard'}
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
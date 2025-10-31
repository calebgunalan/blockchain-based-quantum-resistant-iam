import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

export function SessionTimeoutWarning() {
  const { timeoutWarning, timeUntilTimeout, extendSession } = useSessionTimeout();

  if (!timeoutWarning || !timeUntilTimeout) return null;

  const minutes = Math.floor(timeUntilTimeout / 60);
  const seconds = Math.floor(timeUntilTimeout % 60);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Session Expiring Soon
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <Button onClick={extendSession} size="sm" variant="outline" className="w-full">
            Extend Session
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

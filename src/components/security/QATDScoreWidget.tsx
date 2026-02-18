import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { computeQATDScore, predictTimeToThreshold, type QATDScore } from "@/lib/quantum-adaptive-trust";
import { Atom, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function QATDScoreWidget() {
  const { user } = useAuth();
  const [score, setScore] = useState<QATDScore | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await computeQATDScore(user.id);
      setScore(s);
    } catch (e) {
      toast.error('Failed to compute QATD score');
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [user]);

  const riskColors: Record<string, string> = {
    minimal: 'default',
    low: 'default',
    medium: 'secondary',
    high: 'secondary',
    critical: 'destructive',
  };

  const barColor = score
    ? score.score >= 0.7 ? 'hsl(var(--primary))' : score.score >= 0.4 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))'
    : 'hsl(var(--primary))';

  const hoursLeft = score ? predictTimeToThreshold(score, 0.4) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Atom className="h-4 w-4 text-primary" />
            QATD Trust Score
          </CardTitle>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">Quantum-Adaptive Trust Decay (Novel)</CardDescription>
      </CardHeader>
      <CardContent>
        {score ? (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{(score.score * 100).toFixed(1)}%</span>
              <Badge variant={riskColors[score.risk_level] as any} className="mb-1 text-xs">
                {score.risk_level}
              </Badge>
            </div>

            <div className="w-full rounded-full h-2 bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${score.score * 100}%`, backgroundColor: barColor }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Behavioral</p>
                <p className="text-sm font-medium">{(score.behavioral_factor * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Key Age</p>
                <p className="text-sm font-medium">{(score.key_age_factor * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chain</p>
                <p className="text-sm font-medium">{(score.blockchain_continuity * 100).toFixed(0)}%</p>
              </div>
            </div>

            {hoursLeft !== null && hoursLeft < 24 && (
              <div className="flex items-center gap-1 text-xs text-chart-4">
                <TrendingDown className="h-3 w-3" />
                Score drops below 40% in ~{hoursLeft.toFixed(1)}h — consider key rotation
              </div>
            )}

            {score.components.session_gap_detected && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                ⚠ Blockchain gap detected — BASC chain flagged
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Updated: {new Date(score.computed_at).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">{loading ? 'Computing...' : 'No score available'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

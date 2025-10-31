import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { checkBrowserCompatibility, getRecommendedBrowsers, type BrowserCompatibility } from '@/lib/browser-compatibility';

export function BrowserCompatibilityChecker() {
  const [compatibility, setCompatibility] = useState<BrowserCompatibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBrowserCompatibility().then((result) => {
      setCompatibility(result);
      setLoading(false);
      
      if (!result.isSupported) {
        console.warn('Browser compatibility issues detected:', result.warnings);
      }
    });
  }, []);

  if (loading || !compatibility) {
    return null;
  }

  // Only show if there are warnings
  if (compatibility.warnings.length === 0) {
    return null;
  }

  return (
    <Alert variant={compatibility.isSupported ? "default" : "destructive"} className="mb-4">
      {compatibility.isSupported ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {compatibility.isSupported 
          ? 'Browser Compatibility Warnings' 
          : 'Browser Not Fully Supported'}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-2 mt-2">
          <p className="text-sm">
            Browser: {compatibility.browser.name} {compatibility.browser.version}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {compatibility.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
          {!compatibility.isSupported && (
            <div className="mt-3">
              <p className="text-sm font-semibold mb-1">Recommended browsers:</p>
              <div className="flex flex-wrap gap-2">
                {getRecommendedBrowsers().map((browser) => (
                  <Badge key={browser} variant="outline">{browser}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function BrowserCompatibilityDetails() {
  const [compatibility, setCompatibility] = useState<BrowserCompatibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBrowserCompatibility().then((result) => {
      setCompatibility(result);
      setLoading(false);
    });
  }, []);

  if (loading || !compatibility) {
    return <div>Loading compatibility information...</div>;
  }

  const FeatureStatus = ({ supported, label }: { supported: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      {supported ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Browser Compatibility Report
        </CardTitle>
        <CardDescription>
          Quantum cryptography feature support for {compatibility.browser.name} {compatibility.browser.version}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Overall Status</h4>
          <Badge variant={compatibility.isSupported ? "default" : "destructive"}>
            {compatibility.isSupported ? 'Fully Supported' : 'Not Supported'}
          </Badge>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Required Features</h4>
          <div className="border rounded-md p-2">
            <FeatureStatus 
              supported={compatibility.features.webCrypto} 
              label="Web Crypto API" 
            />
            <FeatureStatus 
              supported={compatibility.features.subtleCrypto} 
              label="SubtleCrypto API" 
            />
            <FeatureStatus 
              supported={compatibility.features.randomValues} 
              label="Secure Random Values" 
            />
            <FeatureStatus 
              supported={compatibility.features.bigIntSupport} 
              label="BigInt Support" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Optional Features</h4>
          <div className="border rounded-md p-2">
            <FeatureStatus 
              supported={compatibility.features.wasmSupport} 
              label="WebAssembly" 
            />
          </div>
        </div>

        {compatibility.warnings.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-destructive">Warnings</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {compatibility.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Recommended Browsers</h4>
          <div className="flex flex-wrap gap-2">
            {getRecommendedBrowsers().map((browser) => (
              <Badge key={browser} variant="outline">{browser}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

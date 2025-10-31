import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceReportGenerator, generateAndSaveComplianceReport } from '@/lib/compliance-report-generator';
import { EnhancedQuantumBlockchain } from '@/lib/enhanced-quantum-blockchain';
import { useToast } from '@/hooks/use-toast';
import { Download, FileCheck, Shield } from 'lucide-react';

export function ComplianceReportViewer() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  const generateReport = async () => {
    try {
      setLoading(true);
      const blockchain = new EnhancedQuantumBlockchain();
      const result = await generateAndSaveComplianceReport(blockchain);
      
      setReport(result.report);
      
      toast({
        title: "Compliance Report Generated",
        description: "Report is ready for export",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compliance-report.json';
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Report Generator
        </CardTitle>
        <CardDescription>
          Generate cryptographically signed compliance attestations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={generateReport} disabled={loading}>
            <FileCheck className="mr-2 h-4 w-4" />
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
          
          {report && (
            <Button onClick={downloadJSON} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download JSON-LD
            </Button>
          )}
        </div>

        {report && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Report ID: {report.id}</p>
            <p>Issued: {new Date(report.issuanceDate).toLocaleString()}</p>
            <p>Status: {report.proof ? '✅ Cryptographically Signed' : '⚠️ Unsigned'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

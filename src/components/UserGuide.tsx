import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Clock, Shield, HelpCircle, Lock, AlertTriangle } from 'lucide-react';

export function UserGuide() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Guide</h1>
        <p className="text-muted-foreground">Complete guide to using the Quantum-Resistant IAM System</p>
      </div>

      <Tabs defaultValue="mfa" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mfa"><Smartphone className="h-4 w-4 mr-2" />MFA Setup</TabsTrigger>
          <TabsTrigger value="jit"><Clock className="h-4 w-4 mr-2" />JIT Access</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="h-4 w-4 mr-2" />FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="mfa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />Multi-Factor Authentication (MFA) Setup
              </CardTitle>
              <CardDescription>Protect your account with quantum-resistant MFA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert><Shield className="h-4 w-4" /><AlertDescription>MFA adds an extra layer of security beyond your password.</AlertDescription></Alert>
              <div><h3 className="font-semibold mb-2">Step 1: Navigate to Settings</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Click on your profile in the top right corner</li>
                  <li>Select "Settings" from the dropdown menu</li>
                  <li>Navigate to the "Security" tab</li>
                </ol>
              </div>
              <div><h3 className="font-semibold mb-2">Step 2: Enable MFA</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Find the "Multi-Factor Authentication" section</li>
                  <li>Click "Enable MFA" button</li>
                  <li>A QR code will be displayed</li>
                </ol>
              </div>
              <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription><strong>Important:</strong> Store your backup codes securely.</AlertDescription></Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />Just-In-Time (JIT) Access
              </CardTitle>
              <CardDescription>Request temporary elevated access to specific resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><h3 className="font-semibold mb-2">What is JIT Access?</h3>
                <p className="text-sm text-muted-foreground">Just-In-Time access grants temporary permissions only when needed, for a limited time period.</p>
              </div>
              <div><h3 className="font-semibold mb-2">How to Request JIT Access</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Navigate to the resource you need access to</li>
                  <li>Click the "Request Access" button</li>
                  <li>Select the access duration (1-8 hours)</li>
                  <li>Provide a business justification</li>
                  <li>Submit your request</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />Security Features
              </CardTitle>
              <CardDescription>Understanding quantum-resistant security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><h3 className="font-semibold mb-2">Quantum-Resistant Cryptography</h3>
                <p className="text-sm text-muted-foreground mb-2">This system uses NIST-standardized post-quantum cryptographic algorithms.</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="border rounded-md p-3">
                    <Badge className="mb-2">ML-KEM-768</Badge>
                    <p className="text-xs text-muted-foreground">Key encapsulation for secure key exchange</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <Badge className="mb-2">ML-DSA-65</Badge>
                    <p className="text-xs text-muted-foreground">Digital signatures for authentication</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-quantum">
                  <AccordionTrigger>What is quantum resistance?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Quantum resistance refers to cryptographic algorithms that remain secure against attacks from quantum computers.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="why-mfa">
                  <AccordionTrigger>Why do I need MFA?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Multi-factor authentication adds a second layer of security beyond your password.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="browser-support">
                  <AccordionTrigger>Which browsers are supported?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+ are recommended for full quantum cryptography support.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

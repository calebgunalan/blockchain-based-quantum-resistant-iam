import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function QuantumSecurityInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Why Quantum Security Matters</DialogTitle>
          <DialogDescription>
            Understanding the quantum threat and our protection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">🚨 The Quantum Threat</h3>
            <p className="text-sm text-muted-foreground">
              Quantum computers with Shor's algorithm can break RSA-2048 encryption in hours. 
              Classical algorithms like ECDSA and RSA are fundamentally vulnerable to quantum attacks. 
              This poses a critical threat to all current cryptographic systems protecting digital identities, 
              financial transactions, and sensitive data.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🛡️ Our Solution</h3>
            <p className="text-sm text-muted-foreground">
              We use NIST-approved post-quantum algorithms (ML-KEM, ML-DSA) based on lattice cryptography. 
              These algorithms are resistant to both classical and quantum attacks.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li><strong>ML-KEM-1024 (Kyber)</strong>: Quantum-resistant key encapsulation for secure key exchange</li>
              <li><strong>ML-DSA-87 (Dilithium)</strong>: Quantum-safe digital signatures for authentication</li>
              <li><strong>Security Level</strong>: NIST Level 5 - equivalent to AES-256 security</li>
              <li><strong>Quantum Hardness</strong>: Requires 2^256 operations to break - far beyond quantum capabilities</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">🔐 Hybrid Protection</h3>
            <p className="text-sm text-muted-foreground">
              Hybrid mode combines classical + post-quantum cryptography. Your data is secure even if one 
              algorithm is compromised. This provides defense-in-depth against both current and future threats.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Implementation in This System</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All identity transactions are signed with ML-DSA-87</li>
              <li>Session keys are exchanged using ML-KEM-1024</li>
              <li>Blockchain blocks are cryptographically sealed with quantum-resistant hashes</li>
              <li>Zero-trust scoring includes quantum protection as a key factor</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

interface InfoDialogProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function InfoDialog({ title, description, children }: InfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

// Quantum Security Info
export function QuantumSecurityInfoDialog() {
  return (
    <InfoDialog
      title="Why Quantum Security Matters"
      description="Understanding the quantum threat and our protection"
    >
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
          <li><strong>Quantum Hardness</strong>: Requires 2^256 operations to break</li>
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
    </InfoDialog>
  );
}

// Blockchain Info
export function BlockchainInfoDialog() {
  return (
    <InfoDialog
      title="Understanding Blockchain in IAM"
      description="How blockchain technology enhances identity and access management"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">⛓️ What is Blockchain-Based IAM?</h3>
        <p className="text-sm text-muted-foreground">
          Blockchain provides a decentralized, immutable ledger for identity management. Every identity 
          transaction is recorded in a block, linked cryptographically to previous blocks, making 
          tampering virtually impossible.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔗 Key Blockchain Components</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Blocks</strong>: Containers holding batches of identity transactions</li>
          <li><strong>Hash</strong>: Unique cryptographic fingerprint linking each block</li>
          <li><strong>Merkle Tree</strong>: Efficient verification of transaction integrity</li>
          <li><strong>Consensus</strong>: Proof-of-Stake validation by trusted validators</li>
          <li><strong>P2P Network</strong>: Distributed synchronization across nodes</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">✅ Benefits</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Immutability</strong>: Once recorded, identity events cannot be altered</li>
          <li><strong>Transparency</strong>: Full audit trail of all access events</li>
          <li><strong>Decentralization</strong>: No single point of failure</li>
          <li><strong>Quantum Resistance</strong>: All blocks signed with ML-DSA-87</li>
        </ul>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">In This System</h4>
        <p className="text-sm text-muted-foreground">
          Each user action (login, permission change, role assignment) creates a transaction that 
          gets mined into a block with quantum-resistant signatures, ensuring complete auditability 
          and tamper-proof records.
        </p>
      </div>
    </InfoDialog>
  );
}

// Zero Trust Info
export function ZeroTrustInfoDialog() {
  return (
    <InfoDialog
      title="Zero Trust Security Model"
      description="Never trust, always verify - continuous authentication"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔒 What is Zero Trust?</h3>
        <p className="text-sm text-muted-foreground">
          Zero Trust is a security model that requires continuous verification of every user, device, 
          and transaction. Unlike traditional perimeter security, Zero Trust assumes no implicit trust 
          based on network location or previous authentication.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📊 Trust Score Components</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Device Trust (25%)</strong>: Known device, browser fingerprint, security posture</li>
          <li><strong>Network Security (20%)</strong>: VPN usage, secure connection, IP reputation</li>
          <li><strong>Location Trust (15%)</strong>: Geographic consistency, impossible travel detection</li>
          <li><strong>Behavioral Analysis (25%)</strong>: Usage patterns, anomaly detection</li>
          <li><strong>Quantum Protection (15%)</strong>: PQC enablement, hybrid mode status</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📈 Bayesian Trust Calculation</h3>
        <p className="text-sm text-muted-foreground">
          Trust scores are calculated using Bayesian probability, updating beliefs based on new evidence. 
          This allows dynamic adjustment as user behavior changes, providing adaptive security that 
          responds to real-time risk indicators.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Trust Thresholds</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>85-100%</strong>: Full access granted</li>
          <li><strong>70-84%</strong>: Standard access with monitoring</li>
          <li><strong>50-69%</strong>: Limited access, MFA required</li>
          <li><strong>Below 50%</strong>: Access denied, investigation required</li>
        </ul>
      </div>
    </InfoDialog>
  );
}

// Session Management Info
export function SessionInfoDialog() {
  return (
    <InfoDialog
      title="Session Management"
      description="Understanding user sessions and security controls"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔐 What are Sessions?</h3>
        <p className="text-sm text-muted-foreground">
          A session represents an authenticated user's active connection to the system. Sessions track 
          user activity, maintain authentication state, and enable security monitoring across devices 
          and locations.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📋 Session Attributes</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>User Agent</strong>: Browser/device identification</li>
          <li><strong>IP Address</strong>: Network location tracking</li>
          <li><strong>Geolocation</strong>: Physical location detection</li>
          <li><strong>Last Activity</strong>: Most recent user interaction</li>
          <li><strong>Duration</strong>: Total session length</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">⚡ Security Features</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Timeout Policies</strong>: Automatic logout after inactivity</li>
          <li><strong>Concurrent Session Limits</strong>: Restrict multiple logins</li>
          <li><strong>Remote Termination</strong>: Force logout from any session</li>
          <li><strong>Anomaly Detection</strong>: Alert on suspicious session activity</li>
        </ul>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Quantum-Enhanced Sessions</h4>
        <p className="text-sm text-muted-foreground">
          Session tokens in this system use ML-KEM-1024 for key exchange, ensuring that session 
          data cannot be intercepted or replayed by future quantum computers.
        </p>
      </div>
    </InfoDialog>
  );
}

// MFA Info
export function MFAInfoDialog() {
  return (
    <InfoDialog
      title="Multi-Factor Authentication (MFA)"
      description="Adding layers of security beyond passwords"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔑 What is MFA?</h3>
        <p className="text-sm text-muted-foreground">
          Multi-Factor Authentication requires users to provide two or more verification factors to 
          gain access. This significantly reduces the risk of unauthorized access, even if passwords 
          are compromised.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📱 Authentication Factors</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Something You Know</strong>: Password, PIN, security questions</li>
          <li><strong>Something You Have</strong>: Phone, hardware token, smart card</li>
          <li><strong>Something You Are</strong>: Fingerprint, face recognition, voice</li>
          <li><strong>Somewhere You Are</strong>: Location-based verification</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🛡️ Adaptive MFA</h3>
        <p className="text-sm text-muted-foreground">
          Our system uses risk-based adaptive MFA that adjusts authentication requirements based on 
          context. Low-risk scenarios may only need one factor, while high-risk situations require 
          additional verification.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Supported Methods</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Time-based One-Time Passwords (TOTP)</li>
          <li>SMS/Email verification codes</li>
          <li>Hardware security keys (WebAuthn/FIDO2)</li>
          <li>Biometric authentication</li>
        </ul>
      </div>
    </InfoDialog>
  );
}

// Audit Logs Info
export function AuditLogsInfoDialog() {
  return (
    <InfoDialog
      title="Audit Logging"
      description="Comprehensive activity tracking for security and compliance"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">📝 What are Audit Logs?</h3>
        <p className="text-sm text-muted-foreground">
          Audit logs record every significant action in the system, providing a complete trail of 
          who did what, when, and from where. This is essential for security monitoring, incident 
          investigation, and regulatory compliance.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔍 Logged Events</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Authentication</strong>: Login attempts, logouts, MFA events</li>
          <li><strong>Authorization</strong>: Permission grants, role changes</li>
          <li><strong>Data Access</strong>: Resource views, downloads, modifications</li>
          <li><strong>Configuration</strong>: System settings, policy changes</li>
          <li><strong>Security Events</strong>: Attack detection, lockouts, alerts</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔐 Log Integrity</h3>
        <p className="text-sm text-muted-foreground">
          All audit logs are cryptographically signed with ML-DSA-87 and stored on the blockchain, 
          ensuring they cannot be tampered with or deleted. This provides irrefutable evidence for 
          forensic analysis and compliance audits.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Compliance Standards</h4>
        <p className="text-sm text-muted-foreground">
          Our logging meets requirements for SOC 2, ISO 27001, GDPR, HIPAA, and other regulatory 
          frameworks, with configurable retention policies and export capabilities.
        </p>
      </div>
    </InfoDialog>
  );
}

// Permission Management Info
export function PermissionManagementInfoDialog() {
  return (
    <InfoDialog
      title="Permission Management"
      description="Fine-grained access control configuration"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔐 What are Permissions?</h3>
        <p className="text-sm text-muted-foreground">
          Permissions define specific actions that can be performed on resources in the system. 
          Each permission specifies a combination of an action (like VIEW, CREATE, UPDATE, DELETE) 
          and a resource (like users, roles, documents).
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">⚙️ Permission Components</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Action</strong>: What operation is allowed (VIEW, CREATE, UPDATE, DELETE, MANAGE)</li>
          <li><strong>Resource</strong>: Which system resource is affected</li>
          <li><strong>Role Assignment</strong>: Which roles have this permission</li>
          <li><strong>Description</strong>: Human-readable explanation of the permission</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🎯 Role-Permission Matrix</h3>
        <p className="text-sm text-muted-foreground">
          The permission matrix shows which roles have access to which permissions. 
          Click a role button to grant or revoke a permission from that role. Changes 
          take effect immediately and are logged for audit purposes.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Security Considerations</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Follow the principle of least privilege</li>
          <li>Regularly audit permission assignments</li>
          <li>Document the purpose of custom permissions</li>
          <li>Test permission changes in a staging environment first</li>
        </ul>
      </div>
    </InfoDialog>
  );
}

// Advanced Security Info
export function AdvancedSecurityInfoDialog() {
  return (
    <InfoDialog
      title="Advanced Security Features"
      description="Cutting-edge cryptographic protections"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔒 Zero-Knowledge Proofs</h3>
        <p className="text-sm text-muted-foreground">
          ZK proofs allow you to prove you have certain attributes (like age, membership) 
          without revealing the actual data. This enables privacy-preserving authentication 
          where you can verify identity without exposing sensitive information.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔑 Threshold Signatures</h3>
        <p className="text-sm text-muted-foreground">
          Threshold signatures split signing authority among multiple parties. A transaction 
          can only be signed when a minimum threshold of participants agree, preventing single 
          points of compromise and enabling multi-party authorization workflows.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🌐 Cross-Chain Identity</h3>
        <p className="text-sm text-muted-foreground">
          Cross-chain identity enables seamless authentication across multiple blockchain 
          networks. Your identity can be verified on any connected chain without creating 
          separate credentials, improving user experience while maintaining security.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Quantum-Resistant Implementation</h4>
        <p className="text-sm text-muted-foreground">
          All advanced security features use post-quantum cryptography (ML-KEM, ML-DSA) 
          ensuring they remain secure against future quantum computer attacks.
        </p>
      </div>
    </InfoDialog>
  );
}

// Attack Logs Info
export function AttackLogsInfoDialog() {
  return (
    <InfoDialog
      title="Attack Detection & Monitoring"
      description="Real-time security threat intelligence"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🎯 Attack Detection</h3>
        <p className="text-sm text-muted-foreground">
          The system continuously monitors for various attack vectors including brute-force 
          attempts, credential stuffing, session hijacking, and quantum-specific attacks. 
          Detected attacks are logged and can trigger automated responses.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">⚡ Attack Types Monitored</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Shor's Algorithm</strong>: Quantum attacks on RSA/ECC</li>
          <li><strong>Grover's Algorithm</strong>: Quantum brute-force attacks</li>
          <li><strong>Key Extraction</strong>: Attempts to compromise cryptographic keys</li>
          <li><strong>Replay Attacks</strong>: Reusing captured authentication tokens</li>
          <li><strong>Man-in-the-Middle</strong>: Intercepting communications</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🛡️ Automated Response</h3>
        <p className="text-sm text-muted-foreground">
          When attacks are detected, the system can automatically block IP addresses, 
          lock accounts, require additional authentication, or trigger security alerts 
          based on configured policies.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Simulation Testing</h4>
        <p className="text-sm text-muted-foreground">
          Use attack simulations to test your security posture. Simulated attacks help 
          validate that detection and response mechanisms are working correctly without 
          putting real systems at risk.
        </p>
      </div>
    </InfoDialog>
  );
}

// Role Management Info
export function RoleManagementInfoDialog() {
  return (
    <InfoDialog
      title="Role-Based Access Control (RBAC)"
      description="Managing permissions through role assignments"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">👥 What is RBAC?</h3>
        <p className="text-sm text-muted-foreground">
          Role-Based Access Control assigns permissions to roles rather than individual users. 
          Users inherit permissions by being assigned to roles, simplifying permission management 
          and ensuring consistent access policies.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🎭 System Roles</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Admin</strong>: Full system access, user management, configuration</li>
          <li><strong>Moderator</strong>: Limited administrative functions, user support</li>
          <li><strong>User</strong>: Standard access to assigned resources</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔧 Permission Types</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>VIEW</strong>: Read-only access to resources</li>
          <li><strong>CREATE</strong>: Ability to create new records</li>
          <li><strong>UPDATE</strong>: Modify existing data</li>
          <li><strong>DELETE</strong>: Remove records from system</li>
          <li><strong>MANAGE</strong>: Full control including configuration</li>
        </ul>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Principle of Least Privilege</h4>
        <p className="text-sm text-muted-foreground">
          Users should only have the minimum permissions necessary to perform their job functions. 
          This limits the potential damage from compromised accounts and insider threats.
        </p>
      </div>
    </InfoDialog>
  );
}

// User Groups Info
export function UserGroupsInfoDialog() {
  return (
    <InfoDialog
      title="User Group Management"
      description="Organizing users for efficient permission management"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">👥 What are User Groups?</h3>
        <p className="text-sm text-muted-foreground">
          User groups allow you to organize users with similar access needs. Instead of assigning 
          permissions individually, you assign them to groups, making management much more efficient 
          as your organization scales.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">✅ Benefits</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Simplified Management</strong>: One change affects all group members</li>
          <li><strong>Consistency</strong>: All users in a group have identical permissions</li>
          <li><strong>Scalability</strong>: Easily onboard new users to existing groups</li>
          <li><strong>Audit Trail</strong>: Track group membership changes over time</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">🔗 Group Hierarchy</h3>
        <p className="text-sm text-muted-foreground">
          Groups can be nested, with child groups inheriting permissions from parent groups. 
          This enables complex organizational structures while maintaining simple permission rules.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Best Practices</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Create groups based on job functions, not individuals</li>
          <li>Review group memberships regularly</li>
          <li>Document the purpose of each group</li>
          <li>Use descriptive group names</li>
        </ul>
      </div>
    </InfoDialog>
  );
}

// IP Access Info
export function IPAccessInfoDialog() {
  return (
    <InfoDialog
      title="IP Access Control"
      description="Network-level security through IP filtering"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🌐 What is IP Access Control?</h3>
        <p className="text-sm text-muted-foreground">
          IP access control restricts system access based on the user's IP address. This adds a 
          network-level security layer that can block malicious actors before they even attempt 
          authentication.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📋 Control Types</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Whitelist</strong>: Only allow access from specified IPs</li>
          <li><strong>Blacklist</strong>: Block access from specific IPs</li>
          <li><strong>Range Rules</strong>: Allow/block entire IP ranges (CIDR notation)</li>
          <li><strong>Geo-blocking</strong>: Restrict access by country/region</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">⚠️ Use Cases</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Restrict admin access to corporate network only</li>
          <li>Block known malicious IP addresses</li>
          <li>Enforce geographic access policies</li>
          <li>Limit access during security incidents</li>
        </ul>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Integration with Zero Trust</h4>
        <p className="text-sm text-muted-foreground">
          IP reputation is a factor in the Zero Trust score calculation. Connections from 
          suspicious IPs or unexpected locations will lower the trust score and may trigger 
          additional authentication requirements.
        </p>
      </div>
    </InfoDialog>
  );
}

// Account Lockout Info
export function AccountLockoutInfoDialog() {
  return (
    <InfoDialog
      title="Account Lockout Protection"
      description="Defending against brute-force authentication attacks"
    >
      <div>
        <h3 className="font-semibold text-lg mb-2">🔒 What is Account Lockout?</h3>
        <p className="text-sm text-muted-foreground">
          Account lockout temporarily disables an account after too many failed login attempts. 
          This prevents brute-force attacks where attackers try many password combinations to 
          gain unauthorized access.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">⚙️ Lockout Policies</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>Threshold</strong>: Number of failed attempts before lockout (default: 5)</li>
          <li><strong>Duration</strong>: How long the account remains locked (default: 30 min)</li>
          <li><strong>Progressive</strong>: Increasing lockout duration for repeat offenders</li>
          <li><strong>Admin Override</strong>: Manually unlock accounts when needed</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">📊 Monitoring</h3>
        <p className="text-sm text-muted-foreground">
          Track lockout events to identify potential attacks, compromised credentials, or users 
          who need password assistance. Unusual patterns may indicate targeted attack campaigns.
        </p>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Smart Lockout</h4>
        <p className="text-sm text-muted-foreground">
          Our system uses intelligent lockout that considers context - familiar devices from 
          known locations get more lenient thresholds, while suspicious connections trigger 
          immediate lockout after fewer attempts.
        </p>
      </div>
    </InfoDialog>
  );
}

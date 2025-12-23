import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminGate } from '@/components/PermissionGate';
import { useNavigate } from 'react-router-dom';
import { useQuantumSecurity } from '@/hooks/useQuantumSecurity';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar } from 'recharts';
import { 
  ArrowLeft, 
  Atom, 
  Blocks, 
  Network, 
  Shield, 
  Key,
  Activity,
  Zap,
  Lock,
  CheckCircle,
  Play,
  RotateCw,
  Eye,
  Cpu,
  Hash,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

interface BlockVisualization {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  transactions: number;
  validator: string;
  isNew?: boolean;
}

interface QuantumStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'complete';
  output?: string;
}

// Walkthrough steps configuration
const walkthroughSteps: Step[] = [
  {
    target: '.demo-header',
    content: 'Welcome to the Demo Visualization Dashboard! This interactive tool helps you understand and demonstrate the key features of our Quantum-Resistant Blockchain IAM System.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.quick-stats',
    content: 'These cards show real-time system statistics including blockchain height, quantum protection status, trust score, and consensus activity.',
    placement: 'bottom',
  },
  {
    target: '.blockchain-height-card',
    content: '🔗 Blockchain Height: The total number of blocks in the blockchain. Each block contains access control transactions, quantum signatures, and audit logs. This grows continuously as new blocks are added through our Proof-of-Stake consensus mechanism.',
    placement: 'bottom',
  },
  {
    target: '.quantum-status-card',
    content: '🛡️ Quantum Status: Shows whether post-quantum cryptographic protection is enabled. ACTIVE means your identity is protected using ML-KEM-1024 and ML-DSA-87 algorithms, making it resistant to quantum computer attacks.',
    placement: 'bottom',
  },
  {
    target: '.trust-score-card',
    content: '🎯 Trust Score: A real-time security score (0-100%) calculated using Bayesian inference. It considers device trust, network security, location, behavioral patterns, and quantum protection to dynamically determine access permissions.',
    placement: 'bottom',
  },
  {
    target: '.consensus-card',
    content: '⚡ Consensus Status: Indicates the blockchain consensus mechanism is operational. Our Proof-of-Stake (PoS) system uses 10 validators to verify blocks with ~6 second block time and 2-block finality.',
    placement: 'bottom',
  },
  {
    target: '.demo-tabs',
    content: 'Navigate between three main visualization modules: Blockchain Consensus, Quantum Cryptography, and Zero-Trust Scoring.',
    placement: 'top',
  },
  {
    target: '.blockchain-tab',
    content: 'The Blockchain Consensus tab visualizes how blocks are created, linked, and validated using proof-of-stake consensus.',
    placement: 'bottom',
  },
  {
    target: '.add-block-btn',
    content: 'Click this button to simulate adding a new block to the chain. Watch as the block gets created, linked, and validated in real-time!',
    placement: 'left',
  },
  {
    target: '.block-chain-visual',
    content: 'This chain visualization shows each block with its hash, transaction count, and validator. New blocks appear with a golden highlight animation.',
    placement: 'top',
  },
  {
    target: '.consensus-stats',
    content: 'View key consensus metrics: 10 active validators, ~6 second block time, 2-block finality, and 235 tx/s throughput.',
    placement: 'top',
  },
  {
    target: '.quantum-tab-trigger',
    content: 'The Quantum Cryptography tab demonstrates ML-KEM-1024 (Kyber) and ML-DSA-87 (Dilithium) algorithms step-by-step.',
    placement: 'bottom',
  },
  {
    target: '.trust-tab-trigger',
    content: 'The Zero-Trust Scoring tab shows how the Bayesian trust framework calculates dynamic access scores based on multiple factors.',
    placement: 'bottom',
  },
  {
    target: '.reset-demo-btn',
    content: 'Reset all demo visualizations to their initial state at any time using this button.',
    placement: 'left',
  },
];

// Block information walkthrough
const blockInfoSteps: Step[] = [
  {
    target: '.block-chain-visual',
    content: '📦 Each block stores: Identity transactions, quantum-resistant signatures (ML-DSA-87), access control events, audit logs, and cryptographic hashes linking to the previous block.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.consensus-stats',
    content: '📊 Blockchain Consensus Metrics explained:',
    placement: 'top',
  },
  {
    target: '.active-validators-stat',
    content: '👥 Active Validators (10): Independent nodes that validate and propose new blocks. Each validator stakes tokens to participate and earns rewards for honest behavior.',
    placement: 'bottom',
  },
  {
    target: '.block-time-stat',
    content: '⏱️ Block Time (~6 seconds): Average time between new blocks. Fast block times ensure quick transaction finality while maintaining security and decentralization.',
    placement: 'bottom',
  },
  {
    target: '.finality-stat',
    content: '✅ Finality (2 blocks): Number of confirmations needed for irreversibility. After 2 blocks (~12 seconds), transactions are cryptographically final and cannot be reversed.',
    placement: 'bottom',
  },
  {
    target: '.throughput-stat',
    content: '🚀 Throughput (235 tx/s): Maximum transactions per second the blockchain can process. Our optimized consensus handles 235 identity/access operations per second.',
    placement: 'bottom',
  },
];

// Quantum demo walkthrough
const quantumDemoSteps: Step[] = [
  {
    target: '.quantum-step-1',
    content: '🔐 Step 1 - Key Generation: Uses ML-KEM-1024 (Kyber) to generate a quantum-resistant keypair based on lattice cryptography. Public key (1568 bytes) is shared; private key is securely stored.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.quantum-step-2',
    content: '🔒 Step 2 - Encapsulation: Creates a shared secret using the public key. The ciphertext (1568 bytes) is sent, and both parties derive the same 32-byte AES-256 encryption key without transmitting it.',
    placement: 'right',
  },
  {
    target: '.quantum-step-3',
    content: '✍️ Step 3 - Signature Creation: Signs data using ML-DSA-87 (Dilithium). Creates a 4627-byte quantum-resistant digital signature that proves authenticity and cannot be forged even by quantum computers.',
    placement: 'right',
  },
  {
    target: '.quantum-step-4',
    content: '✅ Step 4 - Verification: Verifies the signature using the public key. Ensures data integrity and authenticity. The lattice-based hardness requires 2^256 operations to break—far beyond quantum capabilities.',
    placement: 'right',
  },
  {
    target: '.quantum-step-5',
    content: '🔐 Step 5 - Session Establishment: Creates a quantum-safe encrypted session using the shared secret. All communication is protected with post-quantum encryption, ensuring long-term security.',
    placement: 'right',
  },
];

// Trust calculation walkthrough
const trustCalculationSteps: Step[] = [
  {
    target: '.trust-factor-device-trust',
    content: '📱 Device Trust (Weight: 20%)\n\n🔍 What it measures:\n• OS version & security patches\n• Antivirus/malware protection status\n• Disk encryption enabled\n• Device fingerprint consistency\n• Trusted Platform Module (TPM) presence\n\n📊 Calculation:\nDevice Score = (OS_Patch × 0.25) + (AV_Status × 0.25) + (Encryption × 0.25) + (Fingerprint × 0.25)\n\n✅ Current Score: 85% (Strong device security posture)',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.trust-factor-network-security',
    content: '🌐 Network Security (Weight: 25%)\n\n🔍 What it measures:\n• VPN usage detection\n• Public WiFi risk assessment\n• Firewall status verification\n• Threat intelligence feed checks\n• DNS security validation\n\n📊 Calculation:\nNetwork Score = (VPN_Factor × 0.3) + (WiFi_Risk × 0.25) + (Firewall × 0.25) + (Threat_Intel × 0.2)\n\n⚠️ Current Score: 78% (Mostly secure, minor risks detected)',
    placement: 'right',
  },
  {
    target: '.trust-factor-location-trust',
    content: '📍 Location Trust (Weight: 15%)\n\n🔍 What it measures:\n• Geographic risk assessment\n• Known threat region detection\n• Unusual location change patterns\n• Approved location matching\n• Travel velocity analysis\n\n📊 Calculation:\nLocation Score = (Geo_Risk × 0.3) + (Approved_Location × 0.4) + (Velocity_Check × 0.3)\n\n✅ Current Score: 90% (Expected location patterns)',
    placement: 'right',
  },
  {
    target: '.trust-factor-behavioral-analysis',
    content: '🧠 Behavioral Analysis (Weight: 25%)\n\n🔍 What it measures:\n• Login time patterns\n• Typing rhythm analysis\n• Navigation behavior\n• Mouse movement patterns\n• Session activity anomalies\n\n📊 Calculation:\nBehavior Score = (Time_Pattern × 0.25) + (Typing × 0.25) + (Navigation × 0.25) + (Anomaly × 0.25)\n\n✅ Current Score: 82% (Normal behavioral patterns)',
    placement: 'right',
  },
  {
    target: '.trust-factor-quantum-protection',
    content: '🛡️ Quantum Protection (Weight: 15%)\n\n🔍 What it measures:\n• Post-quantum key generation status\n• ML-KEM-1024 adoption\n• ML-DSA-87 signature usage\n• Key rotation compliance\n• Quantum-safe session encryption\n\n📊 Calculation:\nQuantum Score = Enabled ? 95% : 45%\n\n✅ Current Score: 95% (Full quantum protection active)',
    placement: 'right',
  },
  {
    target: '.trust-formula',
    content: '📐 Bayesian Trust Calculation\n\nFormula: T(u,t) = Σ(wᵢ × fᵢ) / Σwᵢ\n\n📊 Live Calculation with Current Values:\n\n• Device Trust:     0.20 × 85 = 17.00\n• Network Security: 0.25 × 78 = 19.50\n• Location Trust:   0.15 × 90 = 13.50\n• Behavior:         0.25 × 82 = 20.50\n• Quantum:          0.15 × 95 = 14.25\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal: (17 + 19.5 + 13.5 + 20.5 + 14.25) / 1.0\n= 84.75% ≈ 85%\n\n🎯 Access Decision: GRANTED (Score > 70% threshold)',
    placement: 'top',
  },
];

export default function DemoVisualization() {
  const navigate = useNavigate();
  const { quantumEnabled } = useQuantumSecurity();
  
  const [blocks, setBlocks] = useState<BlockVisualization[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [quantumSteps, setQuantumSteps] = useState<QuantumStep[]>([]);
  const [activeDemo, setActiveDemo] = useState<'blockchain' | 'quantum' | 'trust'>('blockchain');
  const [trustScore, setTrustScore] = useState(0);
  const [trustFactors, setTrustFactors] = useState<any[]>([]);
  const [trustScoreHistory, setTrustScoreHistory] = useState<any[]>([]);
  const [factorRadarData, setFactorRadarData] = useState<any[]>([]);
  
  // Walkthrough state
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [runBlockInfoTour, setRunBlockInfoTour] = useState(false);
  const [runQuantumTour, setRunQuantumTour] = useState(false);
  const [runTrustTour, setRunTrustTour] = useState(false);

  // Initialize demo data
  useEffect(() => {
    initializeBlocks();
    initializeQuantumSteps();
    fetchTrustFactors();
    
    // Auto-start walkthrough after a brief delay
    const timer = setTimeout(() => {
      setRunTour(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRunTour(false);
      setStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index on Next/Back
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      
      // Switch tabs based on step
      if (index === 6 && action === ACTIONS.NEXT) {
        setActiveDemo('quantum');
      } else if (index === 7 && action === ACTIONS.NEXT) {
        setActiveDemo('trust');
      } else if (index === 7 && action === ACTIONS.PREV) {
        setActiveDemo('blockchain');
      }
    }
  }, []);

  const initializeBlocks = () => {
    const initialBlocks: BlockVisualization[] = [
      {
        index: 0,
        hash: '0x000...genesis',
        previousHash: '0x000...000',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        transactions: 0,
        validator: 'Genesis'
      },
      {
        index: 1,
        hash: '0x7f3...a2b',
        previousHash: '0x000...genesis',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        transactions: 3,
        validator: 'Node-1'
      },
      {
        index: 2,
        hash: '0x9c4...d5e',
        previousHash: '0x7f3...a2b',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        transactions: 5,
        validator: 'Node-2'
      },
      {
        index: 3,
        hash: '0xb2f...8g1',
        previousHash: '0x9c4...d5e',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        transactions: 2,
        validator: 'Node-3'
      },
      {
        index: 4,
        hash: '0xe1a...c7h',
        previousHash: '0xb2f...8g1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        transactions: 4,
        validator: 'Node-1'
      }
    ];
    setBlocks(initialBlocks);
  };

  const initializeQuantumSteps = () => {
    setQuantumSteps([
      { step: 1, name: 'Key Generation', description: 'Generate ML-KEM-1024 keypair using lattice-based cryptography', status: 'pending' },
      { step: 2, name: 'Encapsulation', description: 'Create shared secret using public key', status: 'pending' },
      { step: 3, name: 'Signature Creation', description: 'Sign data with ML-DSA-87 (Dilithium)', status: 'pending' },
      { step: 4, name: 'Verification', description: 'Verify quantum-resistant signature', status: 'pending' },
      { step: 5, name: 'Session Establishment', description: 'Establish quantum-safe encrypted session', status: 'pending' }
    ]);
  };

  const fetchTrustFactors = async () => {
    const { data } = await supabase
      .from('trust_score_factors')
      .select('*')
      .limit(5);
    
    let factors;
    if (data && data.length > 0) {
      factors = data;
      setTrustFactors(data);
      const avgScore = data.reduce((sum, f) => sum + (f.score || 0), 0) / data.length;
      setTrustScore(Math.round(avgScore));
    } else {
      // Demo data - Fixed duplicate Network Security
      factors = [
        { factor_name: 'Device Trust', score: 85, weight: 0.2 },
        { factor_name: 'Network Security', score: 78, weight: 0.25 },
        { factor_name: 'Location Trust', score: 90, weight: 0.15 },
        { factor_name: 'Behavioral Analysis', score: 82, weight: 0.25 },
        { factor_name: 'Quantum Protection', score: quantumEnabled ? 95 : 45, weight: 0.15 }
      ];
      setTrustFactors(factors);
      setTrustScore(quantumEnabled ? 85 : 72);
    }

    // Generate historical trust score data for charts
    const now = new Date();
    const historyData = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      const baseScore = quantumEnabled ? 85 : 72;
      const variation = Math.sin(i * 0.5) * 5 + (Math.random() - 0.5) * 8;
      historyData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        score: Math.round(Math.max(50, Math.min(100, baseScore + variation))),
        device: Math.round(85 + (Math.random() - 0.5) * 10),
        network: Math.round(78 + (Math.random() - 0.5) * 15),
        location: Math.round(90 + (Math.random() - 0.5) * 8),
        behavior: Math.round(82 + (Math.random() - 0.5) * 12),
        quantum: quantumEnabled ? 95 : 45
      });
    }
    setTrustScoreHistory(historyData);

    // Set radar chart data
    setFactorRadarData([
      { factor: 'Device', score: factors[0]?.score || 85, fullMark: 100 },
      { factor: 'Network', score: factors[1]?.score || 78, fullMark: 100 },
      { factor: 'Location', score: factors[2]?.score || 90, fullMark: 100 },
      { factor: 'Behavior', score: factors[3]?.score || 82, fullMark: 100 },
      { factor: 'Quantum', score: factors[4]?.score || (quantumEnabled ? 95 : 45), fullMark: 100 }
    ]);
  };

  const simulateNewBlock = async () => {
    setIsAnimating(true);
    
    const lastBlock = blocks[blocks.length - 1];
    const newBlock: BlockVisualization = {
      index: lastBlock.index + 1,
      hash: `0x${Math.random().toString(16).substring(2, 5)}...${Math.random().toString(16).substring(2, 5)}`,
      previousHash: lastBlock.hash,
      timestamp: new Date().toISOString(),
      transactions: Math.floor(Math.random() * 8) + 1,
      validator: `Node-${Math.floor(Math.random() * 5) + 1}`,
      isNew: true
    };

    // Add new block with animation
    setBlocks(prev => [...prev.slice(-4), newBlock]);

    // Log to audit (ignore errors)
    try {
      await supabase.rpc('log_audit_event', {
        _action: 'BLOCKCHAIN_DEMO',
        _resource: 'demo_visualization',
        _details: { block_index: newBlock.index, demo_mode: true } as any
      });
    } catch {
      // Silently ignore audit logging errors
    }

    setTimeout(() => {
      setBlocks(prev => prev.map(b => ({ ...b, isNew: false })));
      setIsAnimating(false);
    }, 1500);
  };

  const runQuantumDemo = async () => {
    setIsAnimating(true);
    setRunQuantumTour(true); // Start quantum walkthrough
    
    for (let i = 0; i < quantumSteps.length; i++) {
      // Set current step to running
      setQuantumSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === i ? 'running' : idx < i ? 'complete' : 'pending'
      })));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Complete the step with output
      const outputs = [
        'Public Key: ML-KEM-1024 (3168 bytes)\nPrivate Key: Encrypted & Stored',
        'Shared Secret: 32 bytes AES-256 key\nCiphertext: 1568 bytes',
        'Signature: ML-DSA-87 (4627 bytes)\nHash Algorithm: SHA3-256',
        'Verification: ✓ VALID\nLattice Hardness: 2^256 operations',
        'Session ID: QS-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      ];

      setQuantumSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx <= i ? 'complete' : 'pending',
        output: idx === i ? outputs[i] : step.output
      })));
    }

    setIsAnimating(false);
  };

  const simulateTrustCalculation = async () => {
    setIsAnimating(true);
    setRunTrustTour(true); // Start trust calculation walkthrough
    
    // Reset scores first
    setTrustFactors(prev => prev.map(f => ({ ...f, score: 0 })));
    
    // Animate each factor
    for (let i = 0; i < trustFactors.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const targetScore = i === 4 ? (quantumEnabled ? 95 : 45) : [85, 78, 90, 82][i];
      setTrustFactors(prev => prev.map((f, idx) => ({
        ...f,
        score: idx === i ? targetScore : f.score
      })));
    }

    setIsAnimating(false);
  };

  const resetDemo = () => {
    toast.info('Resetting demo visualizations...', { duration: 1000 });
    initializeBlocks();
    initializeQuantumSteps();
    fetchTrustFactors();
    setTimeout(() => {
      toast.success('Demo reset complete!');
    }, 500);
  };

  const startTour = () => {
    setStepIndex(0);
    setRunTour(true);
  };

  return (
    <AdminGate>
      {/* Main Walkthrough */}
      <Joyride
        steps={walkthroughSteps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        disableOverlayClose
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: 'hsl(45, 93%, 47%)',
            backgroundColor: 'hsl(var(--card))',
            textColor: 'hsl(var(--foreground))',
            arrowColor: 'hsl(var(--card))',
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '12px',
            padding: '20px',
          },
          tooltipTitle: {
            fontSize: '18px',
            fontWeight: 600,
          },
          tooltipContent: {
            fontSize: '14px',
            lineHeight: '1.6',
          },
          buttonNext: {
            backgroundColor: 'hsl(45, 93%, 47%)',
            color: '#000',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 600,
          },
          buttonBack: {
            color: 'hsl(var(--foreground))',
            marginRight: '8px',
          },
          buttonSkip: {
            color: 'hsl(var(--muted-foreground))',
          },
          spotlight: {
            borderRadius: '12px',
          },
        }}
        locale={{
          back: '← Previous',
          close: 'Close',
          last: 'Finish Tour',
          next: 'Next →',
          skip: 'Skip Tour',
        }}
      />

      {/* Block Info Walkthrough */}
      <Joyride
        steps={blockInfoSteps}
        run={runBlockInfoTour}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={(data) => {
          if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(data.status)) {
            setRunBlockInfoTour(false);
          }
        }}
        styles={{
          options: {
            primaryColor: 'hsl(45, 93%, 47%)',
            backgroundColor: 'hsl(var(--card))',
            textColor: 'hsl(var(--foreground))',
            zIndex: 10000,
          },
        }}
      />

      {/* Quantum Demo Walkthrough */}
      <Joyride
        steps={quantumDemoSteps}
        run={runQuantumTour}
        continuous
        showSkipButton
        showProgress
        callback={(data) => {
          if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(data.status)) {
            setRunQuantumTour(false);
          }
        }}
        styles={{
          options: {
            primaryColor: 'hsl(45, 93%, 47%)',
            backgroundColor: 'hsl(var(--card))',
            textColor: 'hsl(var(--foreground))',
            zIndex: 10000,
          },
        }}
      />

      {/* Trust Calculation Walkthrough */}
      <Joyride
        steps={trustCalculationSteps}
        run={runTrustTour}
        continuous
        showSkipButton
        showProgress
        callback={(data) => {
          if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(data.status)) {
            setRunTrustTour(false);
          }
        }}
        styles={{
          options: {
            primaryColor: 'hsl(45, 93%, 47%)',
            backgroundColor: 'hsl(var(--card))',
            textColor: 'hsl(var(--foreground))',
            zIndex: 10000,
          },
        }}
      />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6 demo-header">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-8 w-8 text-[hsl(var(--demo-gold))]" />
                <h1 className="text-3xl font-bold">Demo Visualization Dashboard</h1>
              </div>
              <p className="text-muted-foreground">
                Interactive visualization of blockchain consensus, quantum cryptography algorithms, and zero-trust scoring
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={startTour}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Start Tour
              </Button>
              <Button 
                variant="outline" 
                onClick={resetDemo}
                disabled={isAnimating}
                className="reset-demo-btn"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 quick-stats">
          <Card className="blockchain-height-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blockchain Height</p>
                  <p className="text-2xl font-bold">{blocks.length}</p>
                </div>
                <Blocks className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="quantum-status-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantum Status</p>
                  <p className="text-2xl font-bold">{quantumEnabled ? 'ACTIVE' : 'OFF'}</p>
                </div>
                <Atom className={`h-8 w-8 ${quantumEnabled ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
          <Card className="trust-score-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trust Score</p>
                  <p className="text-2xl font-bold">{trustScore}%</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="consensus-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consensus</p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
                <Network className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)} className="space-y-4 demo-tabs">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blockchain" className="blockchain-tab">
              <Blocks className="h-4 w-4 mr-2" />
              Blockchain Consensus
            </TabsTrigger>
            <TabsTrigger value="quantum" className="quantum-tab-trigger">
              <Atom className="h-4 w-4 mr-2" />
              Quantum Cryptography
            </TabsTrigger>
            <TabsTrigger value="trust" className="trust-tab-trigger">
              <Shield className="h-4 w-4 mr-2" />
              Zero-Trust Scoring
            </TabsTrigger>
          </TabsList>

          {/* Blockchain Visualization */}
          <TabsContent value="blockchain" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Blocks className="h-5 w-5" />
                      Blockchain Visualization
                    </CardTitle>
                    <CardDescription>
                      Real-time view of block creation and consensus mechanism
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setRunBlockInfoTour(true)}
                      variant="outline"
                      size="sm"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={simulateNewBlock} 
                      disabled={isAnimating}
                      className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90 add-block-btn"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Add New Block
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Block Chain Visual */}
                <div className="overflow-x-auto pb-4 block-chain-visual">
                  <div className="flex items-center gap-4 min-w-max">
                    {blocks.map((block, idx) => (
                      <div key={block.index} className="flex items-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Card className={`w-48 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-lg ${block.isNew ? 'ring-2 ring-[hsl(var(--demo-gold))] animate-pulse scale-105' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant={block.index === 0 ? 'secondary' : 'default'}>
                                    Block #{block.index}
                                  </Badge>
                                  {block.isNew && (
                                    <Badge className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))]">NEW</Badge>
                                  )}
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono truncate">{block.hash}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-muted-foreground" />
                                    <span>{block.transactions} tx</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Cpu className="h-3 w-3 text-muted-foreground" />
                                    <span>{block.validator}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Blocks className="h-5 w-5" />
                                Block #{block.index} Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Block Hash</p>
                                  <p className="font-mono text-sm bg-muted p-2 rounded">{block.hash}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Previous Hash</p>
                                  <p className="font-mono text-sm bg-muted p-2 rounded">{block.previousHash}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                                  <p className="text-lg font-bold">{block.transactions} tx</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-muted-foreground">Validator</p>
                                  <Badge variant="outline">{block.validator}</Badge>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                                <p className="text-sm">{new Date(block.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg space-y-2">
                                <p className="text-sm font-medium">Block Contents:</p>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                  <li>• Identity transactions with quantum signatures</li>
                                  <li>• Access control events (ML-DSA-87 signed)</li>
                                  <li>• Audit log entries</li>
                                  <li>• Merkle root: {block.hash.slice(0, 8)}...merkle</li>
                                  <li>• Consensus votes from validators</li>
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {idx < blocks.length - 1 && (
                          <div className="flex items-center px-2">
                            <div className="w-8 h-0.5 bg-primary"></div>
                            <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-primary"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consensus Status */}
                <div className="mt-6 p-4 bg-muted rounded-lg consensus-stats">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Proof-of-Stake Consensus
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="active-validators-stat">
                      <p className="text-muted-foreground">Active Validators</p>
                      <p className="font-bold">10</p>
                    </div>
                    <div className="block-time-stat">
                      <p className="text-muted-foreground">Block Time</p>
                      <p className="font-bold">~6 seconds</p>
                    </div>
                    <div className="finality-stat">
                      <p className="text-muted-foreground">Finality</p>
                      <p className="font-bold">2 blocks</p>
                    </div>
                    <div className="throughput-stat">
                      <p className="text-muted-foreground">Throughput</p>
                      <p className="font-bold">235 tx/s</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quantum Cryptography Visualization */}
          <TabsContent value="quantum" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Atom className="h-5 w-5" />
                      Post-Quantum Cryptography Flow
                    </CardTitle>
                    <CardDescription>
                      Step-by-step visualization of ML-KEM-1024 and ML-DSA-87 algorithms
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={runQuantumDemo} 
                    disabled={isAnimating}
                    className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Demo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quantumSteps.map((step) => (
                    <div 
                      key={step.step}
                      className={`p-4 rounded-lg border transition-all duration-500 quantum-step-${step.step} ${
                        step.status === 'running' ? 'border-[hsl(var(--demo-gold))] bg-[hsl(var(--demo-gold))]/10 animate-pulse' :
                        step.status === 'complete' ? 'border-green-500 bg-green-500/10' :
                        'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === 'complete' ? 'bg-green-500' :
                            step.status === 'running' ? 'bg-[hsl(var(--demo-gold))]' :
                            'bg-muted'
                          }`}>
                            {step.status === 'complete' ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : step.status === 'running' ? (
                              <Zap className="h-4 w-4 text-black animate-spin" />
                            ) : (
                              <span className="text-sm font-bold">{step.step}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{step.name}</h4>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                        <Badge variant={
                          step.status === 'complete' ? 'default' :
                          step.status === 'running' ? 'secondary' :
                          'outline'
                        }>
                          {step.status.toUpperCase()}
                        </Badge>
                      </div>
                      {step.output && (
                        <div className="mt-3 p-3 bg-background rounded border font-mono text-xs whitespace-pre-wrap">
                          {step.output}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Algorithm Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        ML-KEM-1024 (Kyber)
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Security Level:</span> NIST Level 5</p>
                        <p><span className="text-muted-foreground">Public Key:</span> 1568 bytes</p>
                        <p><span className="text-muted-foreground">Ciphertext:</span> 1568 bytes</p>
                        <p><span className="text-muted-foreground">Shared Secret:</span> 32 bytes</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        ML-DSA-87 (Dilithium)
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Security Level:</span> NIST Level 5</p>
                        <p><span className="text-muted-foreground">Public Key:</span> 2592 bytes</p>
                        <p><span className="text-muted-foreground">Signature:</span> 4627 bytes</p>
                        <p><span className="text-muted-foreground">Quantum Safe:</span> 2^256 operations</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust Score Visualization */}
          <TabsContent value="trust" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Zero-Trust Score Calculation
                    </CardTitle>
                    <CardDescription>
                      Real-time trust score computation using Bayesian framework
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={simulateTrustCalculation} 
                    disabled={isAnimating}
                    className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Calculate Score
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Overall Score */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${
                    trustScore >= 80 ? 'border-green-500' :
                    trustScore >= 60 ? 'border-yellow-500' :
                    'border-red-500'
                  }`}>
                    <div>
                      <span className="text-4xl font-bold">{trustScore}</span>
                      <span className="text-xl">%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-muted-foreground">Overall Trust Score</p>
                </div>

                {/* Trust Factors */}
                <div className="space-y-4">
                  {trustFactors.map((factor, idx) => {
                    // Create unique class names for each factor
                    const factorClasses: Record<string, string> = {
                      'Device Trust': 'device-trust',
                      'Network Security': 'network-security',
                      'Location Trust': 'location-trust',
                      'Behavioral Analysis': 'behavioral-analysis',
                      'Quantum Protection': 'quantum-protection'
                    };
                    const factorClass = factorClasses[factor.factor_name] || factor.factor_name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div key={idx} className={`space-y-2 trust-factor-${factorClass}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{factor.factor_name}</span>
                          <span className="text-sm text-muted-foreground">
                            Weight: {(factor.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={factor.score} className="flex-1" />
                          <span className="text-sm font-bold w-12 text-right">{factor.score}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Trust Score History Charts */}
                <div className="mt-8 space-y-6">
                  {/* Historical Trend Chart */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trust Score Trend (Last 24 Hours)
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trustScoreHistory}>
                          <defs>
                            <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="time" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis domain={[0, 100]} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            fill="url(#trustGradient)"
                            strokeWidth={2}
                            name="Trust Score"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Factor Breakdown Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <div>
                      <h4 className="font-semibold mb-4">Factor Distribution</h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={factorRadarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="factor" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Radar
                              name="Current Score"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart - Factor Comparison */}
                    <div>
                      <h4 className="font-semibold mb-4">Factor Comparison</h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={factorRadarData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="factor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="score" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                              name="Score"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Factor Trend */}
                  <div>
                    <h4 className="font-semibold mb-4">Factor Trends Over Time</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trustScoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="device" stroke="#3b82f6" strokeWidth={2} dot={false} name="Device" />
                          <Line type="monotone" dataKey="network" stroke="#10b981" strokeWidth={2} dot={false} name="Network" />
                          <Line type="monotone" dataKey="location" stroke="#f59e0b" strokeWidth={2} dot={false} name="Location" />
                          <Line type="monotone" dataKey="behavior" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Behavior" />
                          <Line type="monotone" dataKey="quantum" stroke="#ec4899" strokeWidth={2} dot={false} name="Quantum" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Formula Display */}
                <div className="mt-6 p-4 bg-muted rounded-lg trust-formula">
                  <h4 className="font-semibold mb-2">Bayesian Trust Calculation Formula</h4>
                  <div className="font-mono text-sm bg-background p-3 rounded border">
                    T(u,t) = Σ(wᵢ × fᵢ(u,t)) / Σwᵢ
                    <br />
                    <span className="text-muted-foreground">where wᵢ = factor weight, fᵢ = factor score</span>
                    <br /><br />
                    <span className="text-xs">
                      Current: ({trustFactors.map(f => `${(f.weight * 100).toFixed(0)}%×${f.score}`).join(' + ')}) / 100
                      = {trustScore}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGate>
  );
}

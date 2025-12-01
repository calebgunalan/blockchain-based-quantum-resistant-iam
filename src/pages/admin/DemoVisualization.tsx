import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminGate } from '@/components/PermissionGate';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useQuantumSecurity } from '@/hooks/useQuantumSecurity';
import { supabase } from '@/integrations/supabase/client';
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
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  Eye,
  Database,
  Binary,
  Cpu,
  Hash
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

export default function DemoVisualization() {
  const navigate = useNavigate();
  const { chainStatus } = useBlockchain();
  const { quantumEnabled } = useQuantumSecurity();
  
  const [blocks, setBlocks] = useState<BlockVisualization[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [quantumSteps, setQuantumSteps] = useState<QuantumStep[]>([]);
  const [activeDemo, setActiveDemo] = useState<'blockchain' | 'quantum' | 'trust'>('blockchain');
  const [trustScore, setTrustScore] = useState(0);
  const [trustFactors, setTrustFactors] = useState<any[]>([]);

  // Initialize demo data
  useEffect(() => {
    initializeBlocks();
    initializeQuantumSteps();
    fetchTrustFactors();
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
    
    if (data && data.length > 0) {
      setTrustFactors(data);
      const avgScore = data.reduce((sum, f) => sum + (f.score || 0), 0) / data.length;
      setTrustScore(Math.round(avgScore));
    } else {
      // Demo data
      setTrustFactors([
        { factor_name: 'Device Trust', score: 85, weight: 0.2 },
        { factor_name: 'Network Security', score: 78, weight: 0.25 },
        { factor_name: 'Location Trust', score: 90, weight: 0.15 },
        { factor_name: 'Behavioral Analysis', score: 82, weight: 0.25 },
        { factor_name: 'Quantum Protection', score: quantumEnabled ? 95 : 45, weight: 0.15 }
      ]);
      setTrustScore(quantumEnabled ? 85 : 72);
    }
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

    // Log to audit
    await supabase.rpc('log_audit_event', {
      _action: 'BLOCKCHAIN_DEMO',
      _resource: 'demo_visualization',
      _details: { block_index: newBlock.index, demo_mode: true } as any
    });

    setTimeout(() => {
      setBlocks(prev => prev.map(b => ({ ...b, isNew: false })));
      setIsAnimating(false);
    }, 1500);
  };

  const runQuantumDemo = async () => {
    setIsAnimating(true);
    
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
    
    // Animate each factor
    for (let i = 0; i < trustFactors.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setTrustFactors(prev => prev.map((f, idx) => ({
        ...f,
        score: idx <= i ? f.score : 0
      })));
    }

    setIsAnimating(false);
  };

  const resetDemo = () => {
    initializeBlocks();
    initializeQuantumSteps();
    fetchTrustFactors();
  };

  return (
    <AdminGate>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
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
            <Button 
              variant="outline" 
              onClick={resetDemo}
              disabled={isAnimating}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Reset Demo
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
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
          <Card>
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
          <Card>
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
          <Card>
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

        <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="blockchain">
              <Blocks className="h-4 w-4 mr-2" />
              Blockchain Consensus
            </TabsTrigger>
            <TabsTrigger value="quantum">
              <Atom className="h-4 w-4 mr-2" />
              Quantum Cryptography
            </TabsTrigger>
            <TabsTrigger value="trust">
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
                  <Button 
                    onClick={simulateNewBlock} 
                    disabled={isAnimating}
                    className="bg-[hsl(var(--demo-gold))] text-[hsl(var(--demo-gold-foreground))] hover:bg-[hsl(var(--demo-gold))]/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Add New Block
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Block Chain Visual */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex items-center gap-4 min-w-max">
                    {blocks.map((block, idx) => (
                      <div key={block.index} className="flex items-center">
                        <Card className={`w-48 transition-all duration-500 ${block.isNew ? 'ring-2 ring-[hsl(var(--demo-gold))] animate-pulse scale-105' : ''}`}>
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
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Proof-of-Stake Consensus
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Active Validators</p>
                      <p className="font-bold">10</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Block Time</p>
                      <p className="font-bold">~6 seconds</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Finality</p>
                      <p className="font-bold">2 blocks</p>
                    </div>
                    <div>
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
                  {quantumSteps.map((step, idx) => (
                    <div 
                      key={step.step} 
                      className={`p-4 rounded-lg border transition-all duration-500 ${
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
                  {trustFactors.map((factor, idx) => (
                    <div key={idx} className="space-y-2">
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
                  ))}
                </div>

                {/* Formula Display */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Bayesian Trust Calculation Formula</h4>
                  <div className="font-mono text-sm bg-background p-3 rounded border">
                    T(u,t) = Σ(wᵢ × fᵢ(u,t)) / Σwᵢ
                    <br />
                    <span className="text-muted-foreground">where wᵢ = factor weight, fᵢ = factor score</span>
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

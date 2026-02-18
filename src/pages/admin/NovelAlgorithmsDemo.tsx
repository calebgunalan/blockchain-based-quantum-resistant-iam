import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { computeQATDScore, predictTimeToThreshold, type QATDScore } from "@/lib/quantum-adaptive-trust";
import { runDLCAFSimulation, type ConsensusResult } from "@/lib/dual-layer-consensus";
import { generateRoleProof, verifyRoleProof, ROLE_CLEARANCE, type FZKRPProof } from "@/lib/fzkrp-engine";
import { createSessionGenesis, recordAction, validateSessionChain, getSessionChain } from "@/lib/basc-session-manager";
import { Atom, Shield, Link, Lock, Play, CheckCircle, XCircle, ChevronRight, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export default function NovelAlgorithmsDemo() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  // QATD State
  const [qatdScore, setQatdScore] = useState<QATDScore | null>(null);
  const [qatdRunning, setQatdRunning] = useState(false);

  // DLCAF State
  const [dlcafResult, setDlcafResult] = useState<{ block: any; result: ConsensusResult; timing: any } | null>(null);
  const [dlcafRunning, setDlcafRunning] = useState(false);

  // FZKRP State
  const [fzkrpProof, setFzkrpProof] = useState<FZKRPProof | null>(null);
  const [fzkrpVerification, setFzkrpVerification] = useState<any | null>(null);
  const [fzkrpRunning, setFzkrpRunning] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState(2);

  // BASC State
  const [bascChain, setBascChain] = useState<any[]>([]);
  const [bascValidation, setBascValidation] = useState<any | null>(null);
  const [bascSessionId, setBascSessionId] = useState<string | null>(null);
  const [bascRunning, setBascRunning] = useState(false);

  if (!user) { navigate('/auth'); return null; }

  // ─── QATD Demo ────────────────────────────────────────────────
  const runQATD = async () => {
    setQatdRunning(true);
    toast.loading('Computing QATD trust score...');
    try {
      const score = await computeQATDScore(user.id);
      setQatdScore(score);
      toast.success(`QATD Score: ${(score.score * 100).toFixed(1)}%`);
    } catch (e) { toast.error('QATD computation failed'); }
    setQatdRunning(false);
  };

  // ─── DLCAF Demo ───────────────────────────────────────────────
  const runDLCAF = async () => {
    setDlcafRunning(true);
    toast.loading('Running dual-layer consensus...');
    try {
      const sim = await runDLCAFSimulation(3);
      setDlcafResult(sim);
      toast.success(sim.result.finalized ? 'Block FINALIZED — both layers agree' : 'Block REJECTED');
    } catch (e) { toast.error('DLCAF simulation failed'); }
    setDlcafRunning(false);
  };

  // ─── FZKRP Demo ───────────────────────────────────────────────
  const runFZKRP = async () => {
    setFzkrpRunning(true);
    setFzkrpVerification(null);
    toast.loading('Generating ZK role proof...');
    try {
      const { proof, success, error } = await generateRoleProof(user.id, selectedClearance);
      if (!success) { toast.error(error || 'Proof generation failed'); setFzkrpRunning(false); return; }
      setFzkrpProof(proof);
      toast.loading('Verifying proof...');
      const ver = await verifyRoleProof(proof);
      setFzkrpVerification(ver);
      toast.success(ver.valid ? 'Proof VERIFIED — identity stays hidden' : 'Proof INVALID');
    } catch (e) { toast.error('FZKRP failed'); }
    setFzkrpRunning(false);
  };

  // ─── BASC Demo ────────────────────────────────────────────────
  const startBASC = async () => {
    setBascRunning(true);
    const sid = crypto.randomUUID();
    setBascSessionId(sid);
    toast.loading('Creating genesis block...');
    await createSessionGenesis(sid, user.id);
    toast.success('Genesis block mined');
    await addBASCAction(sid, 'LOGIN');
    await addBASCAction(sid, 'VIEW_DASHBOARD');
    await addBASCAction(sid, 'READ_DOCUMENT');
    const chain = await getSessionChain(sid, user.id);
    setBascChain(chain);
    const validation = await validateSessionChain(sid, user.id);
    setBascValidation(validation);
    toast.success(`BASC chain: ${chain.length} blocks, ${validation.valid ? 'VALID' : 'GAP DETECTED'}`);
    setBascRunning(false);
  };

  const addBASCAction = async (sid: string, action: string) => {
    await recordAction(sid || '', user.id, action);
  };

  const addMoreAction = async () => {
    if (!bascSessionId) return;
    await addBASCAction(bascSessionId, 'ADDITIONAL_ACTION');
    const chain = await getSessionChain(bascSessionId, user.id);
    setBascChain(chain);
    const validation = await validateSessionChain(bascSessionId, user.id);
    setBascValidation(validation);
    toast.success(`Action added — chain length: ${chain.length}`);
  };

  const riskColor = (score: number) => {
    if (score >= 0.85) return 'text-primary';
    if (score >= 0.60) return 'text-chart-2';
    if (score >= 0.40) return 'text-chart-4';
    return 'text-destructive';
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FlaskConical className="h-8 w-8 text-primary" /> Novel Algorithms — Live Demonstration
        </h1>
        <p className="text-muted-foreground mt-1">
          Four original research contributions — run live in your browser
        </p>
      </div>

      <Tabs defaultValue="qatd">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="qatd"><Atom className="h-4 w-4 mr-1" />QATD</TabsTrigger>
          <TabsTrigger value="dlcaf"><Link className="h-4 w-4 mr-1" />DLCAF</TabsTrigger>
          <TabsTrigger value="fzkrp"><Lock className="h-4 w-4 mr-1" />FZKRP</TabsTrigger>
          <TabsTrigger value="basc"><Shield className="h-4 w-4 mr-1" />BASC</TabsTrigger>
        </TabsList>

        {/* ─── QATD TAB ─── */}
        <TabsContent value="qatd">
          <Card>
            <CardHeader>
              <CardTitle>Quantum-Adaptive Trust Decay (QATD) — Novel Algorithm #1</CardTitle>
              <CardDescription>Continuous authentication scoring with PQC key-age decay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
                <p className="text-primary font-bold">Mathematical Formula:</p>
                <p>QATD(t) = T_base × e<sup>(-λ_b × Δbehavior)</sup> × e<sup>(-λ_k × key_age/90)</sup> × C_blockchain</p>
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p>λ_b = 0.15 — behavioral entropy decay constant</p>
                  <p>λ_k = 0.08 — PQC key age decay constant</p>
                  <p>C_blockchain = 1.0 (chain intact) | 0.7 (gap detected)</p>
                </div>
              </div>

              <Button onClick={runQATD} disabled={qatdRunning} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {qatdRunning ? 'Computing...' : 'Compute My QATD Score'}
              </Button>

              {qatdScore && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${riskColor(qatdScore.score)}`}>
                      {(qatdScore.score * 100).toFixed(1)}%
                    </p>
                    <Badge variant={qatdScore.risk_level === 'minimal' ? 'default' : qatdScore.risk_level === 'critical' ? 'destructive' : 'secondary'} className="mt-2">
                      {qatdScore.risk_level.toUpperCase()} RISK
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Behavioral Factor', value: (qatdScore.behavioral_factor * 100).toFixed(1) + '%', desc: `Δbehavior = ${qatdScore.components.behavioral_deviation.toFixed(2)}` },
                      { label: 'Key Age Factor', value: (qatdScore.key_age_factor * 100).toFixed(1) + '%', desc: `${qatdScore.components.key_age_days.toFixed(0)} days old` },
                      { label: 'Blockchain', value: (qatdScore.blockchain_continuity * 100).toFixed(0) + '%', desc: qatdScore.components.session_gap_detected ? 'Gap detected' : 'Chain intact' },
                    ].map(f => (
                      <div key={f.label} className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="text-xl font-bold">{f.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Trust Level</span>
                      <span>{(qatdScore.score * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={qatdScore.score * 100} className="h-4" />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono">
                    <p>T_base = {qatdScore.t_base.toFixed(3)}</p>
                    <p>× behavioral_factor = {qatdScore.behavioral_factor.toFixed(4)}</p>
                    <p>× key_age_factor = {qatdScore.key_age_factor.toFixed(4)}</p>
                    <p>× C_blockchain = {qatdScore.blockchain_continuity}</p>
                    <Separator className="my-2" />
                    <p className="text-primary font-bold">= QATD = {qatdScore.score.toFixed(6)}</p>
                    <p className="text-muted-foreground mt-1">dQATD/dt = {qatdScore.decay_rate_per_hour.toFixed(6)} per hour</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DLCAF TAB ─── */}
        <TabsContent value="dlcaf">
          <Card>
            <CardHeader>
              <CardTitle>Dual-Layer Consensus with Adaptive Finality (DLCAF) — Novel Algorithm #2</CardTitle>
              <CardDescription>Simultaneous PoW + ML-DSA-87 quorum required for block finality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-2">
                <p className="text-primary font-bold">Consensus Formula:</p>
                <p>FINALITY(block) = POW_valid(block, diff) AND MLDSA_quorum(block, signers ≥ ⌈N × threat_factor⌉)</p>
                <p className="text-xs text-muted-foreground mt-2">threat_factor ∈ [0.51, 0.90] — driven by live anomaly detector</p>
              </div>

              <Button onClick={runDLCAF} disabled={dlcafRunning} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {dlcafRunning ? 'Mining + signing...' : 'Run DLCAF Consensus Simulation (3 validators)'}
              </Button>

              {dlcafResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`border rounded-lg p-4 text-center ${dlcafResult.result.pow_valid ? 'border-primary' : 'border-destructive'}`}>
                      {dlcafResult.result.pow_valid ? <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" /> : <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />}
                      <p className="font-semibold">Layer 1: PoW</p>
                      <p className="text-xs text-muted-foreground mt-1">{dlcafResult.result.pow_valid ? 'VALID' : 'INVALID'}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{dlcafResult.block.pow_hash?.slice(0, 20)}...</p>
                    </div>
                    <div className={`border rounded-lg p-4 text-center ${dlcafResult.result.quorum_achieved ? 'border-primary' : 'border-destructive'}`}>
                      {dlcafResult.result.quorum_achieved ? <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" /> : <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />}
                      <p className="font-semibold">Layer 2: ML-DSA-87</p>
                      <p className="text-xs text-muted-foreground mt-1">{dlcafResult.result.quorum_count}/{dlcafResult.result.quorum_required} valid signatures</p>
                      <p className="text-xs text-muted-foreground mt-1">threat={dlcafResult.result.threat_factor.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 text-center ${dlcafResult.result.finalized ? 'bg-primary/10 border border-primary' : 'bg-destructive/10 border border-destructive'}`}>
                    <p className="text-lg font-bold">{dlcafResult.result.finalized ? '✓ BLOCK FINALIZED' : '✗ BLOCK REJECTED'}</p>
                    {dlcafResult.result.rejection_reason && (
                      <p className="text-xs text-muted-foreground mt-1">{dlcafResult.result.rejection_reason}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="border rounded-lg p-2">
                      <p className="text-muted-foreground text-xs">PoW Mining</p>
                      <p className="font-bold">{dlcafResult.timing.mine_ms}ms</p>
                    </div>
                    <div className="border rounded-lg p-2">
                      <p className="text-muted-foreground text-xs">ML-DSA Signing</p>
                      <p className="font-bold">{dlcafResult.timing.sign_ms}ms</p>
                    </div>
                    <div className="border rounded-lg p-2">
                      <p className="text-muted-foreground text-xs">Finalization</p>
                      <p className="font-bold">{dlcafResult.timing.finalize_ms}ms</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── FZKRP TAB ─── */}
        <TabsContent value="fzkrp">
          <Card>
            <CardHeader>
              <CardTitle>Federated Zero-Knowledge Role Proof (FZKRP) — Novel Algorithm #3</CardTitle>
              <CardDescription>Prove role clearance without revealing identity — Fiat-Shamir over ML-DSA lattice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-primary font-bold">Fiat-Shamir Construction:</p>
                <p>1. C = Hash(ML-DSA-pk || r)    <span className="text-muted-foreground"># commitment</span></p>
                <p>2. e = Hash(C || statement || nonce)  <span className="text-muted-foreground"># challenge</span></p>
                <p>3. s = Hash(r XOR e)           <span className="text-muted-foreground"># response</span></p>
                <p>4. Verify: C consistent with (s, e)   <span className="text-muted-foreground"># zero-knowledge</span></p>
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Minimum Clearance to Prove</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(c => (
                      <Button key={c} size="sm" variant={selectedClearance === c ? 'default' : 'outline'} onClick={() => setSelectedClearance(c)}>
                        Level {c} ({Object.entries(ROLE_CLEARANCE).find(([_, v]) => v === c)?.[0]})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={runFZKRP} disabled={fzkrpRunning} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {fzkrpRunning ? 'Generating proof...' : `Generate ZK Proof (clearance ≥ ${selectedClearance})`}
              </Button>

              {fzkrpProof && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                    <p><span className="text-primary">proof_id:</span> {fzkrpProof.proof_id}</p>
                    <p><span className="text-primary">commitment:</span> {fzkrpProof.commitment.slice(0, 32)}...</p>
                    <p><span className="text-primary">challenge:</span> {fzkrpProof.challenge.slice(0, 32)}...</p>
                    <p><span className="text-primary">response:</span> {fzkrpProof.response.slice(0, 32)}...</p>
                    <p><span className="text-primary">nullifier:</span> {fzkrpProof.nullifier.slice(0, 32)}...</p>
                    <p><span className="text-primary">pk_commitment:</span> {fzkrpProof.public_key_commitment.slice(0, 32)}...</p>
                    <p className="text-muted-foreground">⚠ Identity is NOT revealed — verifier only sees above transcript</p>
                  </div>

                  {fzkrpVerification && (
                    <div className={`rounded-lg p-4 ${fzkrpVerification.valid ? 'bg-primary/10 border border-primary' : 'bg-destructive/10 border border-destructive'}`}>
                      <div className="flex items-center gap-2">
                        {fzkrpVerification.valid ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                        <p className="font-semibold">{fzkrpVerification.valid ? 'Proof VERIFIED' : 'Proof INVALID'}</p>
                      </div>
                      <div className="mt-2 text-xs space-y-1">
                        <p>Statement satisfied: {fzkrpVerification.statement_satisfied ? '✓' : '✗'}</p>
                        <p>Nullifier fresh: {fzkrpVerification.nullifier_fresh ? '✓' : '✗'}</p>
                        <p>Verification time: {fzkrpVerification.verification_time_ms}ms</p>
                        {fzkrpVerification.rejection_reason && <p className="text-destructive">{fzkrpVerification.rejection_reason}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── BASC TAB ─── */}
        <TabsContent value="basc">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain-Anchored Session Continuity (BASC) — Novel Algorithm #4</CardTitle>
              <CardDescription>On-chain session graph — hijacking is cryptographically detectable</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-primary font-bold">Session Chain Formula:</p>
                <p>Session_n.block_ref = Hash(Session_(n-1).block_ref || action_n || timestamp_n)</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Validity: ∀n: blockchain.contains(Session_n.block_ref) AND<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;n.timestamp - (n-1).timestamp &lt; SESSION_WINDOW
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={startBASC} disabled={bascRunning} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {bascRunning ? 'Mining blocks...' : 'Start New BASC Session'}
                </Button>
                {bascSessionId && (
                  <Button variant="outline" onClick={addMoreAction}>
                    + Add Action
                  </Button>
                )}
              </div>

              {bascChain.length > 0 && (
                <div className="space-y-4">
                  {/* Chain visualization */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Session Block Chain ({bascChain.length} blocks)</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {bascChain.map((ref, i) => (
                        <div key={ref.id} className="flex items-center gap-1">
                          <div className={`border rounded-lg p-2 text-xs min-w-[80px] text-center ${ref.gap_detected ? 'border-destructive bg-destructive/10' : ref.is_genesis ? 'border-primary bg-primary/10' : 'border-border'}`}>
                            <p className="font-bold">{ref.is_genesis ? '⌂ GENESIS' : `#${ref.sequence_number}`}</p>
                            <p className="font-mono text-muted-foreground">{ref.block_ref?.slice(0, 8)}...</p>
                            {ref.gap_detected && <p className="text-destructive">GAP!</p>}
                          </div>
                          {i < bascChain.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {bascValidation && (
                    <div className={`rounded-lg p-4 ${bascValidation.valid ? 'bg-primary/10 border border-primary' : 'bg-destructive/10 border border-destructive'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {bascValidation.valid ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                        <p className="font-semibold">{bascValidation.valid ? 'Chain VALID — Session Authentic' : 'Chain BROKEN — Possible Hijack'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs mt-2">
                        <div>
                          <p className="text-muted-foreground">Chain Length</p>
                          <p className="font-bold">{bascValidation.chain_length} blocks</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Gap Detected</p>
                          <p className={`font-bold ${bascValidation.gap_detected ? 'text-destructive' : 'text-primary'}`}>
                            {bascValidation.gap_detected ? 'YES' : 'NO'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hijack Probability</p>
                          <p className={`font-bold ${bascValidation.hijack_probability > 0.5 ? 'text-destructive' : 'text-primary'}`}>
                            {(bascValidation.hijack_probability * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

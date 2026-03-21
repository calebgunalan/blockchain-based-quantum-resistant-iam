const specs = [
  { algorithm: "ML-KEM-1024", keySize: "1,568 B (pk)", security: "256-bit (NIST Level 5)", performance: "Encapsulate: <1 ms" },
  { algorithm: "ML-DSA-87", keySize: "2,592 B (pk)", security: "256-bit (NIST Level 5)", performance: "Sign: <2 ms" },
  { algorithm: "ECDSA P-256", keySize: "64 B (pk)", security: "128-bit (classical)", performance: "Sign: <0.5 ms" },
  { algorithm: "SHA-3-256", keySize: "N/A", security: "128-bit quantum", performance: "Hash: <0.1 ms" },
  { algorithm: "DLCAF Consensus", keySize: "N/A", security: "Dual-layer", performance: "Block: ~10 s" },
  { algorithm: "FZKRP Proofs", keySize: "~3 KB", security: "Lattice-based ZK", performance: "Prove: <5 ms" },
];

const metrics = [
  { label: "Identity Creation", value: "~2 seconds" },
  { label: "Signature Verification", value: "<100 ms" },
  { label: "Blockchain Throughput", value: "235 tx/s" },
  { label: "Block Time", value: "~10 seconds" },
  { label: "Trust Score Update", value: "<50 ms" },
  { label: "ZK Proof Generation", value: "<5 ms" },
];

export default function TechSpecs() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Technical Specifications</h2>
          <p className="text-lg text-muted-foreground">Benchmarked performance across all cryptographic operations.</p>
        </div>

        <div className="overflow-x-auto mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 px-4 font-semibold">Algorithm</th>
                <th className="text-left py-3 px-4 font-semibold">Key Size</th>
                <th className="text-left py-3 px-4 font-semibold">Security Level</th>
                <th className="text-left py-3 px-4 font-semibold">Performance</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((s) => (
                <tr key={s.algorithm} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-medium font-mono text-primary">{s.algorithm}</td>
                  <td className="py-3 px-4">{s.keySize}</td>
                  <td className="py-3 px-4">{s.security}</td>
                  <td className="py-3 px-4">{s.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-2xl font-bold text-primary">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-3">
              <Shield className="h-5 w-5 text-primary" />
              Quantum IAM
            </div>
            <p className="text-sm text-muted-foreground">
              Post-Quantum Secure Blockchain Architecture for Identity and Access Management in Critical Infrastructures.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })}>Solution</button></li>
              <li><button onClick={() => document.getElementById("algorithms")?.scrollIntoView({ behavior: "smooth" })}>Algorithms</button></li>
              <li><button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>Live Demo</button></li>
              <li><Link to="/architecture" className="hover:text-foreground transition-colors">Architecture</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/documentation" className="hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link to="/use-cases" className="hover:text-foreground transition-colors">Use Cases</Link></li>
              <li><Link to="/user-guide" className="hover:text-foreground transition-colors">User Guide</Link></li>
              <li><button onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}>FAQ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">Standards</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>NIST FIPS 203 (ML-KEM)</li>
              <li>NIST FIPS 204 (ML-DSA)</li>
              <li>NIST SP 800-207</li>
              <li>RFC 3161</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>Built with quantum-resistant security. © {new Date().getFullYear()} Quantum IAM Research.</p>
        </div>
      </div>
    </footer>
  );
}

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Why blockchain over traditional databases?",
    a: "Traditional databases allow administrators to alter or delete audit logs. Our blockchain creates an immutable, append-only ledger where every identity event is cryptographically chained to the previous one. Tampering with any record would break the chain — making it immediately detectable.",
  },
  {
    q: "How does this resist quantum attacks specifically?",
    a: "We use ML-KEM-1024 (FIPS 203) for key encapsulation and ML-DSA-87 (FIPS 204) for digital signatures — both NIST-standardised lattice-based algorithms. These rely on the hardness of Module-LWE and Module-SIS problems, which remain intractable even for quantum computers running Shor's algorithm.",
  },
  {
    q: "What's the performance overhead compared to classical crypto?",
    a: "ML-KEM encapsulation adds ~0.5 ms and ML-DSA signing adds ~1.5 ms per operation. Key sizes are larger (1.5 KB vs 32 B for public keys), but the security gain is substantial. Our DLCAF consensus targets 10-second block times with 235 tx/s throughput.",
  },
  {
    q: "How does the system scale?",
    a: "The architecture uses Supabase PostgreSQL with Row-Level Security for horizontal read scaling, edge functions for serverless compute, and blockchain pruning to manage chain growth. The ABAC policy engine evaluates in constant time regardless of user count.",
  },
  {
    q: "What are the current limitations?",
    a: "The blockchain layer is application-scoped (not a public network), PQC key sizes are larger than classical equivalents, and the FZKRP zero-knowledge proofs use a simulated Fiat-Shamir construction rather than a formally verified one. These are documented in our research paper.",
  },
  {
    q: "How would you deploy this in production?",
    a: "The system runs on Supabase Cloud with edge functions for serverless backend logic. Frontend deploys as a static SPA. For enterprise deployment, we recommend dedicated Supabase instances, HSM-backed key storage, and external timestamping via RFC 3161 TSAs.",
  },
  {
    q: "What NIST standards are followed?",
    a: "FIPS 203 (ML-KEM for key encapsulation), FIPS 204 (ML-DSA for digital signatures), SP 800-207 (Zero Trust Architecture), and SP 800-63B (Digital Identity Guidelines). The system is designed for NIST PQC migration compliance.",
  },
  {
    q: "What's the future roadmap?",
    a: "Planned enhancements include: cross-chain identity federation, mobile biometric integration, formal verification of FZKRP proofs, hardware security module (HSM) support, FedRAMP compliance pathway, and integration with W3C Verifiable Credentials.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

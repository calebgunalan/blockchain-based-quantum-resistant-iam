import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, FileText, CheckCircle2, Presentation } from "lucide-react";
import { toast } from "sonner";

const generatePresentation = async () => {
  const pptxgenjs = await import("pptxgenjs");
  const pptx = new pptxgenjs.default();

  pptx.author = "Quantum-Resistant Blockchain IAM";
  pptx.company = "Enterprise Security Solutions";
  pptx.subject = "Client Presentation";
  pptx.title = "Quantum-Resistant Blockchain IAM — Securing Tomorrow, Today";

  // Color palette
  const DARK = "0F172A";
  const PRIMARY = "6366F1";
  const ACCENT = "22D3EE";
  const WHITE = "FFFFFF";
  const LIGHT_BG = "F1F5F9";
  const GREEN = "10B981";
  const ORANGE = "F59E0B";
  const GRAY = "64748B";
  const GRADIENT_START = "4F46E5";

  // ============ SLIDE 1: Title ============
  let slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { type: "solid", color: DARK } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.2, w: "100%", h: 1.3, fill: { type: "solid", color: PRIMARY }, rectRadius: 0 });
  slide.addText("🛡️", { x: 4.3, y: 0.8, w: 1.4, h: 1.2, fontSize: 60, align: "center" });
  slide.addText("Quantum-Resistant\nBlockchain IAM", {
    x: 0.8, y: 2.0, w: 8.4, h: 2.0,
    fontSize: 38, fontFace: "Calibri", bold: true, color: WHITE, align: "center", lineSpacingMultiple: 1.1,
  });
  slide.addText("Securing Tomorrow's Digital Identity — Today", {
    x: 0.8, y: 4.0, w: 8.4, h: 0.6,
    fontSize: 18, fontFace: "Calibri", color: ACCENT, align: "center", italic: true,
  });
  slide.addText("Confidential Client Presentation", {
    x: 0.8, y: 6.45, w: 8.4, h: 0.8,
    fontSize: 14, fontFace: "Calibri", color: WHITE, align: "center",
  });

  // ============ SLIDE 2: The Problem ============
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText("The Growing Threat Landscape", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 30, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const problems = [
    { icon: "⚠️", title: "Quantum Computing Threat", desc: "Current encryption (RSA, ECDSA) will be broken by quantum computers within 5-10 years" },
    { icon: "🔓", title: "Identity Breaches Are #1 Attack Vector", desc: "80% of data breaches involve compromised credentials (Verizon DBIR 2025)" },
    { icon: "📋", title: "Audit Trail Tampering", desc: "Traditional logs can be altered, deleted, or backdated — making forensics unreliable" },
    { icon: "💰", title: "Cost of Inaction", desc: "Average breach cost: $4.88M. Regulatory fines for non-compliance add millions more" },
  ];

  problems.forEach((p, i) => {
    const y = 1.4 + i * 1.2;
    slide.addText(p.icon, { x: 0.6, y, w: 0.7, h: 0.7, fontSize: 28, align: "center" });
    slide.addText(p.title, { x: 1.4, y, w: 7.5, h: 0.4, fontSize: 16, bold: true, fontFace: "Calibri", color: DARK });
    slide.addText(p.desc, { x: 1.4, y: y + 0.4, w: 7.5, h: 0.5, fontSize: 12, fontFace: "Calibri", color: GRAY });
  });

  // ============ SLIDE 3: Our Solution ============
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText("Our Solution", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 30, fontFace: "Calibri", bold: true, color: WHITE,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: ACCENT } });

  slide.addText(
    "A unified identity and access management platform that combines three breakthrough technologies " +
    "into one seamless system — protecting your organization against today's threats AND tomorrow's quantum attacks.",
    {
      x: 0.6, y: 1.3, w: 8.8, h: 1.0,
      fontSize: 14, fontFace: "Calibri", color: "CBD5E1", lineSpacingMultiple: 1.4,
    }
  );

  const pillars = [
    { icon: "🔐", title: "Quantum-Resistant\nEncryption", desc: "NIST-approved algorithms that even quantum computers cannot break" },
    { icon: "⛓️", title: "Blockchain\nAudit Trail", desc: "Tamper-proof, immutable records of every access decision" },
    { icon: "🧠", title: "Intelligent\nTrust Engine", desc: "AI-driven continuous authentication that adapts to behavior in real-time" },
  ];

  pillars.forEach((p, i) => {
    const x = 0.6 + i * 3.1;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.8, w: 2.8, h: 3.8, fill: { type: "solid", color: "1E293B" }, rectRadius: 0.15, line: { color: "334155", width: 1 } });
    slide.addText(p.icon, { x, y: 3.0, w: 2.8, h: 0.9, fontSize: 40, align: "center" });
    slide.addText(p.title, { x: x + 0.2, y: 3.9, w: 2.4, h: 0.8, fontSize: 14, bold: true, fontFace: "Calibri", color: WHITE, align: "center" });
    slide.addText(p.desc, { x: x + 0.2, y: 4.8, w: 2.4, h: 1.2, fontSize: 11, fontFace: "Calibri", color: "94A3B8", align: "center", lineSpacingMultiple: 1.3 });
  });

  // ============ SLIDE 4: How It Works (Simple) ============
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText("How It Works — In Simple Terms", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const steps = [
    { num: "1", title: "Employee Logs In", desc: "Multi-factor authentication with future-proof encryption ensures only the right person gets in", color: PRIMARY },
    { num: "2", title: "System Continuously Verifies", desc: "Our trust engine monitors behavior in real-time — if something seems off, it challenges the user again", color: GREEN },
    { num: "3", title: "Every Action Is Recorded", desc: "All access decisions are written to an immutable blockchain — no one can alter the record, ever", color: ORANGE },
    { num: "4", title: "Smart Policies Decide Access", desc: "Rules automatically determine who can see what, when, and from where — no manual gatekeeping needed", color: ACCENT },
  ];

  steps.forEach((s, i) => {
    const y = 1.4 + i * 1.3;
    slide.addShape(pptx.ShapeType.ellipse, { x: 0.7, y: y + 0.05, w: 0.6, h: 0.6, fill: { type: "solid", color: s.color } });
    slide.addText(s.num, { x: 0.7, y: y + 0.05, w: 0.6, h: 0.6, fontSize: 18, bold: true, fontFace: "Calibri", color: WHITE, align: "center", valign: "middle" });
    slide.addText(s.title, { x: 1.6, y, w: 7.3, h: 0.4, fontSize: 16, bold: true, fontFace: "Calibri", color: DARK });
    slide.addText(s.desc, { x: 1.6, y: y + 0.45, w: 7.3, h: 0.5, fontSize: 12, fontFace: "Calibri", color: GRAY });
    if (i < 3) {
      slide.addShape(pptx.ShapeType.rect, { x: 0.95, y: y + 0.7, w: 0.04, h: 0.55, fill: { type: "solid", color: "E2E8F0" } });
    }
  });

  // ============ SLIDE 5: Key Benefits ============
  slide = pptx.addSlide();
  slide.background = { color: LIGHT_BG };
  slide.addText("Key Benefits For Your Organization", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const benefits = [
    { icon: "🛡️", title: "Future-Proof Security", desc: "Protected against quantum computing threats that will break current encryption within years" },
    { icon: "📊", title: "Complete Audit Compliance", desc: "Meet SOC 2, ISO 27001, NIST, and GDPR requirements with tamper-proof records" },
    { icon: "⚡", title: "Zero-Downtime Operations", desc: "Continuous protection without disrupting employee productivity" },
    { icon: "💡", title: "Intelligent Automation", desc: "Reduce manual security reviews by 70% with AI-driven trust scoring" },
    { icon: "🔒", title: "Insider Threat Detection", desc: "Behavioral analytics catch compromised accounts before damage is done" },
    { icon: "📉", title: "Lower Breach Risk", desc: "Reduce your attack surface by 90% with zero-trust architecture" },
  ];

  benefits.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.5;
    const y = 1.4 + row * 1.6;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.2, h: 1.3, fill: { type: "solid", color: WHITE }, rectRadius: 0.1, shadow: { type: "outer", blur: 6, offset: 2, color: "00000015" } });
    slide.addText(b.icon, { x: x + 0.15, y: y + 0.15, w: 0.6, h: 0.6, fontSize: 24, align: "center" });
    slide.addText(b.title, { x: x + 0.8, y: y + 0.15, w: 3.1, h: 0.4, fontSize: 13, bold: true, fontFace: "Calibri", color: DARK });
    slide.addText(b.desc, { x: x + 0.8, y: y + 0.55, w: 3.1, h: 0.6, fontSize: 10.5, fontFace: "Calibri", color: GRAY, lineSpacingMultiple: 1.3 });
  });

  // ============ SLIDE 6: What Makes Us Different ============
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText("What Makes Us Different", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: ACCENT } });

  slide.addText("Four Proprietary Innovations — Not Available Anywhere Else", {
    x: 0.6, y: 1.2, w: 8.8, h: 0.5,
    fontSize: 13, fontFace: "Calibri", color: ACCENT, italic: true,
  });

  const innovations = [
    { title: "Adaptive Trust Scoring", desc: "Trust isn't binary. Our system calculates a living trust score that decays over time and responds to behavioral changes — like a credit score for security." },
    { title: "Dual-Layer Verification", desc: "Every critical action requires TWO independent verification methods simultaneously, making it virtually impossible for attackers to forge approvals." },
    { title: "Privacy-Preserving Access", desc: "Employees can prove they have the right clearance level without revealing their identity or specific role — protecting privacy while enforcing security." },
    { title: "Tamper-Proof Session Tracking", desc: "Every login session creates a chain of verifiable records. If anyone hijacks a session, the system detects the break in the chain instantly." },
  ];

  innovations.forEach((inn, i) => {
    const y = 1.9 + i * 1.3;
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 8.8, h: 1.1, fill: { type: "solid", color: "1E293B" }, rectRadius: 0.1 });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 0.08, h: 1.1, fill: { type: "solid", color: PRIMARY }, rectRadius: 0 });
    slide.addText(inn.title, { x: 1.0, y, w: 8.0, h: 0.4, fontSize: 14, bold: true, fontFace: "Calibri", color: WHITE });
    slide.addText(inn.desc, { x: 1.0, y: y + 0.4, w: 8.0, h: 0.6, fontSize: 11, fontFace: "Calibri", color: "94A3B8", lineSpacingMultiple: 1.3 });
  });

  // ============ SLIDE 7: Compliance & Standards ============
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText("Compliance & Industry Standards", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const standards = [
    { name: "NIST FIPS 203 & 204", desc: "Post-quantum cryptography standards" },
    { name: "SOC 2 Type II", desc: "Service organization security controls" },
    { name: "ISO 27001", desc: "Information security management" },
    { name: "GDPR / CCPA", desc: "Data privacy regulations" },
    { name: "Zero Trust (NIST 800-207)", desc: "Never trust, always verify architecture" },
    { name: "SCIM 2.0", desc: "Automated user provisioning standard" },
  ];

  standards.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.6 + col * 3.1;
    const y = 1.4 + row * 2.2;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.8, h: 1.8, fill: { type: "solid", color: LIGHT_BG }, rectRadius: 0.15, line: { color: "E2E8F0", width: 1 } });
    slide.addText("✅", { x, y: y + 0.2, w: 2.8, h: 0.5, fontSize: 24, align: "center" });
    slide.addText(s.name, { x: x + 0.15, y: y + 0.7, w: 2.5, h: 0.5, fontSize: 13, bold: true, fontFace: "Calibri", color: DARK, align: "center" });
    slide.addText(s.desc, { x: x + 0.15, y: y + 1.15, w: 2.5, h: 0.4, fontSize: 10, fontFace: "Calibri", color: GRAY, align: "center" });
  });

  // ============ SLIDE 8: By The Numbers ============
  slide = pptx.addSlide();
  slide.background = { color: PRIMARY };
  slide.addText("By The Numbers", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 30, fontFace: "Calibri", bold: true, color: WHITE,
  });

  const metrics = [
    { value: "235", unit: "tx/sec", label: "Blockchain Throughput" },
    { value: "< 50", unit: "ms", label: "Encryption Speed" },
    { value: "256", unit: "bit", label: "Security Level" },
    { value: "99.9%", unit: "", label: "Uptime Guarantee" },
    { value: "70%", unit: "", label: "Fewer Manual Reviews" },
    { value: "90%", unit: "", label: "Attack Surface Reduction" },
  ];

  metrics.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.6 + col * 3.1;
    const y = 1.5 + row * 2.5;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.8, h: 2.0, fill: { type: "solid", color: GRADIENT_START }, rectRadius: 0.15 });
    slide.addText(m.value + (m.unit ? " " + m.unit : ""), { x, y: y + 0.2, w: 2.8, h: 0.9, fontSize: 32, bold: true, fontFace: "Calibri", color: WHITE, align: "center" });
    slide.addText(m.label, { x, y: y + 1.1, w: 2.8, h: 0.5, fontSize: 12, fontFace: "Calibri", color: "C7D2FE", align: "center" });
  });

  // ============ SLIDE 9: Platform Overview ============
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText("Platform At A Glance", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const features = [
    "User & Role Management Dashboard",
    "Real-Time Security Operations Center",
    "Blockchain Block Explorer & Audit Viewer",
    "Identity Governance & Access Reviews",
    "Automated Incident Response Playbooks",
    "Performance Benchmarking Tools",
    "Multi-Factor Authentication (MFA)",
    "Session Monitoring & Control",
    "Compliance Report Generation",
    "Employee Self-Service Portal",
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.5;
    const y = 1.3 + row * 0.95;
    slide.addText("▸  " + f, { x, y, w: 4.2, h: 0.5, fontSize: 13, fontFace: "Calibri", color: DARK });
  });

  // ============ SLIDE 10: Use Cases ============
  slide = pptx.addSlide();
  slide.background = { color: LIGHT_BG };
  slide.addText("Who Is This For?", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const useCases = [
    { icon: "🏦", title: "Financial Services", desc: "Banks and fintechs handling sensitive transactions need quantum-proof security and complete audit trails for regulators." },
    { icon: "🏥", title: "Healthcare", desc: "HIPAA-compliant access management for patient records with tamper-proof audit logging." },
    { icon: "🏛️", title: "Government & Defense", desc: "Classified information access with zero-knowledge proofs — verify clearance without exposing identity." },
    { icon: "🏢", title: "Enterprise IT", desc: "Any organization with 500+ employees needing modern, scalable, future-proof identity management." },
  ];

  useCases.forEach((uc, i) => {
    const x = 0.6 + (i % 2) * 4.5;
    const y = 1.3 + Math.floor(i / 2) * 2.5;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.2, h: 2.1, fill: { type: "solid", color: WHITE }, rectRadius: 0.12, shadow: { type: "outer", blur: 5, offset: 2, color: "00000010" } });
    slide.addText(uc.icon, { x, y: y + 0.15, w: 4.2, h: 0.6, fontSize: 30, align: "center" });
    slide.addText(uc.title, { x: x + 0.2, y: y + 0.7, w: 3.8, h: 0.4, fontSize: 15, bold: true, fontFace: "Calibri", color: DARK, align: "center" });
    slide.addText(uc.desc, { x: x + 0.3, y: y + 1.1, w: 3.6, h: 0.8, fontSize: 10.5, fontFace: "Calibri", color: GRAY, align: "center", lineSpacingMultiple: 1.3 });
  });

  // ============ SLIDE 11: ROI / Business Case ============
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText("The Business Case", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: ACCENT } });

  const roi = [
    { label: "Average Cost of a Data Breach", before: "$4.88M", after: "Prevention", icon: "💰" },
    { label: "Regulatory Non-Compliance Fine", before: "Up to $20M", after: "Full Compliance", icon: "⚖️" },
    { label: "Manual Security Reviews / Year", before: "2,400 hours", after: "720 hours (70% less)", icon: "⏰" },
    { label: "Time to Detect Breach", before: "277 days avg", after: "Real-time detection", icon: "🔍" },
  ];

  roi.forEach((r, i) => {
    const y = 1.4 + i * 1.25;
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y, w: 8.8, h: 1.0, fill: { type: "solid", color: "1E293B" }, rectRadius: 0.08 });
    slide.addText(r.icon + "  " + r.label, { x: 0.8, y, w: 3.5, h: 1.0, fontSize: 12, fontFace: "Calibri", color: "94A3B8", valign: "middle" });
    slide.addText(r.before, { x: 4.5, y, w: 2.2, h: 1.0, fontSize: 14, bold: true, fontFace: "Calibri", color: "F87171", align: "center", valign: "middle" });
    slide.addText("→", { x: 6.5, y, w: 0.6, h: 1.0, fontSize: 18, color: GRAY, align: "center", valign: "middle" });
    slide.addText(r.after, { x: 7.0, y, w: 2.2, h: 1.0, fontSize: 14, bold: true, fontFace: "Calibri", color: GREEN, align: "center", valign: "middle" });
  });

  // ============ SLIDE 12: Implementation Timeline ============
  slide = pptx.addSlide();
  slide.background = { color: WHITE };
  slide.addText("Implementation Roadmap", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  // Timeline line
  slide.addShape(pptx.ShapeType.rect, { x: 1.0, y: 3.6, w: 8.0, h: 0.06, fill: { type: "solid", color: "E2E8F0" } });

  const phases = [
    { week: "Week 1-2", title: "Discovery &\nSetup", color: PRIMARY },
    { week: "Week 3-4", title: "Core Security\nDeployment", color: GREEN },
    { week: "Week 5-6", title: "Integration &\nTesting", color: ORANGE },
    { week: "Week 7-8", title: "Go-Live &\nTraining", color: ACCENT },
  ];

  phases.forEach((p, i) => {
    const x = 1.0 + i * 2.15;
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.6, y: 3.35, w: 0.55, h: 0.55, fill: { type: "solid", color: p.color } });
    slide.addText((i + 1).toString(), { x: x + 0.6, y: 3.35, w: 0.55, h: 0.55, fontSize: 16, bold: true, fontFace: "Calibri", color: WHITE, align: "center", valign: "middle" });
    slide.addText(p.week, { x, y: 1.8, w: 1.8, h: 0.5, fontSize: 11, fontFace: "Calibri", color: GRAY, align: "center" });
    slide.addText(p.title, { x, y: 2.2, w: 1.8, h: 0.8, fontSize: 13, bold: true, fontFace: "Calibri", color: DARK, align: "center" });
    slide.addText(p.title, { x, y: 4.2, w: 1.8, h: 0.8, fontSize: 11, fontFace: "Calibri", color: GRAY, align: "center" });
  });

  // ============ SLIDE 13: Team & Support ============
  slide = pptx.addSlide();
  slide.background = { color: LIGHT_BG };
  slide.addText("Ongoing Support & Partnership", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.8,
    fontSize: 28, fontFace: "Calibri", bold: true, color: DARK,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.0, w: 2.0, h: 0.06, fill: { type: "solid", color: PRIMARY } });

  const support = [
    { icon: "🎓", title: "Training & Onboarding", desc: "Comprehensive training for your IT team and end-users" },
    { icon: "📞", title: "24/7 Priority Support", desc: "Dedicated support line with < 1hr response for critical issues" },
    { icon: "🔄", title: "Continuous Updates", desc: "Regular security patches and feature enhancements included" },
    { icon: "📈", title: "Quarterly Reviews", desc: "Strategic security reviews and compliance health checks" },
  ];

  support.forEach((s, i) => {
    const x = 0.6 + (i % 2) * 4.5;
    const y = 1.3 + Math.floor(i / 2) * 2.3;
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.2, h: 1.9, fill: { type: "solid", color: WHITE }, rectRadius: 0.1 });
    slide.addText(s.icon, { x, y: y + 0.2, w: 4.2, h: 0.5, fontSize: 28, align: "center" });
    slide.addText(s.title, { x: x + 0.2, y: y + 0.7, w: 3.8, h: 0.4, fontSize: 14, bold: true, fontFace: "Calibri", color: DARK, align: "center" });
    slide.addText(s.desc, { x: x + 0.3, y: y + 1.1, w: 3.6, h: 0.5, fontSize: 11, fontFace: "Calibri", color: GRAY, align: "center", lineSpacingMultiple: 1.3 });
  });

  // ============ SLIDE 14: Call To Action ============
  slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText("🛡️", { x: 4.3, y: 1.0, w: 1.4, h: 1.0, fontSize: 50, align: "center" });
  slide.addText("Ready to Secure Your Future?", {
    x: 0.6, y: 2.2, w: 8.8, h: 1.0,
    fontSize: 34, fontFace: "Calibri", bold: true, color: WHITE, align: "center",
  });
  slide.addText(
    "Don't wait for a breach or a quantum breakthrough to force your hand.\nAct now to build a security foundation that lasts decades.",
    {
      x: 1.5, y: 3.3, w: 7.0, h: 1.0,
      fontSize: 14, fontFace: "Calibri", color: "94A3B8", align: "center", lineSpacingMultiple: 1.5,
    }
  );

  const ctas = [
    "Schedule a Live Demo",
    "Request a Security Assessment",
    "Start a Pilot Program",
  ];

  ctas.forEach((c, i) => {
    const x = 0.8 + i * 3.0;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 4.8, w: 2.7, h: 0.7, fill: { type: "solid", color: i === 0 ? PRIMARY : "1E293B" }, rectRadius: 0.1, line: { color: PRIMARY, width: i === 0 ? 0 : 1.5 } });
    slide.addText(c, { x, y: 4.8, w: 2.7, h: 0.7, fontSize: 12, bold: true, fontFace: "Calibri", color: WHITE, align: "center", valign: "middle" });
  });

  // ============ SLIDE 15: Thank You ============
  slide = pptx.addSlide();
  slide.background = { color: PRIMARY };
  slide.addText("Thank You", {
    x: 0.6, y: 2.0, w: 8.8, h: 1.2,
    fontSize: 44, fontFace: "Calibri", bold: true, color: WHITE, align: "center",
  });
  slide.addText("Quantum-Resistant Blockchain IAM", {
    x: 0.6, y: 3.3, w: 8.8, h: 0.6,
    fontSize: 16, fontFace: "Calibri", color: "C7D2FE", align: "center",
  });
  slide.addText("Questions & Discussion", {
    x: 0.6, y: 4.5, w: 8.8, h: 0.6,
    fontSize: 20, fontFace: "Calibri", color: WHITE, align: "center", italic: true,
  });

  return pptx;
};

const PresentationDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const pptx = await generatePresentation();
      await pptx.writeFile({ fileName: "Quantum-IAM-Client-Presentation.pptx" });
      setIsGenerated(true);
      toast.success("Presentation downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate presentation");
    } finally {
      setIsGenerating(false);
    }
  };

  const slideOutline = [
    "Title Slide — Quantum-Resistant Blockchain IAM",
    "The Growing Threat Landscape",
    "Our Solution — Three Pillars",
    "How It Works — In Simple Terms",
    "Key Benefits For Your Organization",
    "What Makes Us Different — 4 Innovations",
    "Compliance & Industry Standards",
    "By The Numbers — Key Metrics",
    "Platform At A Glance",
    "Who Is This For? — Use Cases",
    "The Business Case — ROI",
    "Implementation Roadmap",
    "Ongoing Support & Partnership",
    "Call To Action",
    "Thank You & Discussion",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <Presentation className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Client Presentation Generator</h1>
        <p className="text-muted-foreground">
          Download a polished, non-technical .pptx presentation ready for your client meeting
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Slide Outline
            </CardTitle>
            <CardDescription>15 slides designed for a 20-minute client pitch</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {slideOutline.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium">.pptx (PowerPoint)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slides</span><span className="font-medium">15</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">~20 minutes</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Audience</span><span className="font-medium">Non-technical clients</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tone</span><span className="font-medium">Professional & persuasive</span></div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <Button
                onClick={handleDownload}
                disabled={isGenerating}
                size="lg"
                className="w-full text-base h-14"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Presentation...
                  </>
                ) : isGenerated ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Download Again
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Generate & Download .pptx
                  </>
                )}
              </Button>
              {isGenerated && (
                <p className="text-center text-sm text-primary mt-3 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  File saved to your Downloads folder
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PresentationDownload;

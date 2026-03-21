import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import HowItWorks from "@/components/landing/HowItWorks";
import ArchitectureDiagram from "@/components/landing/ArchitectureDiagram";
import NovelAlgorithms from "@/components/landing/NovelAlgorithms";
import TechSpecs from "@/components/landing/TechSpecs";
import UseCasesSection from "@/components/landing/UseCasesSection";
import DemoSection from "@/components/landing/DemoSection";
import TechStack from "@/components/landing/TechStack";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <ArchitectureDiagram />
      <NovelAlgorithms />
      <TechSpecs />
      <UseCasesSection />
      <DemoSection />
      <TechStack />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;

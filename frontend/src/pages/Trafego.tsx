import HeroSection from "@/components/landing/traffic/HeroSection";
import ProblemSection from "@/components/landing/traffic/ProblemSection";
import SolutionSection from "@/components/landing/traffic/SolutionSection";
import BenefitsSection from "@/components/landing/traffic/BenefitsSection";
import SocialProofSection from "@/components/landing/traffic/SocialProofSection";
import PricingSection from "@/components/landing/traffic/PricingSection";
import LPFooter from "@/components/landing/traffic/LPFooter";

const Trafego = () => {
    return (
        <main className="min-h-screen bg-lp-background text-lp-foreground font-sans selection:bg-lp-accent/30 selection:text-lp-accent">
            <HeroSection />
            <SocialProofSection />
            <ProblemSection />
            <SolutionSection />
            <BenefitsSection />
            <PricingSection />
            <LPFooter />
        </main>
    );
};

export default Trafego;

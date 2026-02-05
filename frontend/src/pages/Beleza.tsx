import HeroSection from "@/components/landing/beleza/HeroSection";
import ProblemSection from "@/components/landing/beleza/ProblemSection";
import SolutionSection from "@/components/landing/beleza/SolutionSection";
import BenefitsSection from "@/components/landing/beleza/BenefitsSection";
import SocialProofSection from "@/components/landing/beleza/SocialProofSection";
import PricingSection from "@/components/landing/beleza/PricingSection";
import LPFooter from "@/components/landing/beleza/LPFooter";

const Beleza = () => {
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

export default Beleza;

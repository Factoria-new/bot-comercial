import HeroSection from "@/components/landing/saude/HeroSection";
import ProblemSection from "@/components/landing/saude/ProblemSection";
import SolutionSection from "@/components/landing/saude/SolutionSection";
import BenefitsSection from "@/components/landing/saude/BenefitsSection";
import SocialProofSection from "@/components/landing/saude/SocialProofSection";
import PricingSection from "@/components/landing/saude/PricingSection";
import LPFooter from "@/components/landing/saude/LPFooter";

const Saude = () => {
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

export default Saude;

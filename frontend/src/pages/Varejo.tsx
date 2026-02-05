import HeroSection from "@/components/landing/varejo/HeroSection";
import ProblemSection from "@/components/landing/varejo/ProblemSection";
import SolutionSection from "@/components/landing/varejo/SolutionSection";
import BenefitsSection from "@/components/landing/varejo/BenefitsSection";
import SocialProofSection from "@/components/landing/varejo/SocialProofSection";
import PricingSection from "@/components/landing/varejo/PricingSection";
import LPFooter from "@/components/landing/varejo/LPFooter";

const Varejo = () => {
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

export default Varejo;

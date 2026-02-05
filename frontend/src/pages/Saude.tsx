import HeroSection from "@/components/landing/saude/HeroSection";
import ProblemSection from "@/components/landing/saude/ProblemSection";
import SolutionSection from "@/components/landing/saude/SolutionSection";
import BenefitsSection from "@/components/landing/saude/BenefitsSection";
import SocialProofSection from "@/components/landing/saude/SocialProofSection";
import PricingSection from "@/components/landing/saude/PricingSection";
import LPFooter from "@/components/landing/saude/LPFooter";

/**
 * Saude Landing Page - Trust-Focused Design
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables for complete separation.
 */
const Saude = () => {
    return (
        <main
            className="min-h-screen font-sans selection:bg-[hsl(var(--saude-primary)/0.2)] selection:text-[hsl(var(--saude-primary))]"
            style={{
                backgroundColor: 'hsl(var(--saude-background))',
                color: 'hsl(var(--saude-foreground))'
            }}
        >
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

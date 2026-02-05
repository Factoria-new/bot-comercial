import HeroSection from "@/components/landing/varejo/HeroSection";
import ProblemSection from "@/components/landing/varejo/ProblemSection";
import SolutionSection from "@/components/landing/varejo/SolutionSection";
import BenefitsSection from "@/components/landing/varejo/BenefitsSection";
import SocialProofSection from "@/components/landing/varejo/SocialProofSection";
import PricingSection from "@/components/landing/varejo/PricingSection";
import LPFooter from "@/components/landing/varejo/LPFooter";

/**
 * Varejo Landing Page
 * ISOLATED design system for beauty/retail businesses
 * Uses --varejo-* CSS variables (Dark Luxury theme)
 */
const Varejo = () => {
    return (
        <main
            className="min-h-screen font-sans"
            style={{
                backgroundColor: 'hsl(var(--varejo-background))',
                color: 'hsl(var(--varejo-foreground))'
            }}
        >
            <style>{`
                ::selection {
                    background-color: hsl(292 91% 73% / 0.3);
                    color: hsl(292 91% 73%);
                }
            `}</style>
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

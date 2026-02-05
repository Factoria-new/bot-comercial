import HeroSection from "@/components/landing/beleza/HeroSection";
import ProblemSection from "@/components/landing/beleza/ProblemSection";
import SolutionSection from "@/components/landing/beleza/SolutionSection";
import BenefitsSection from "@/components/landing/beleza/BenefitsSection";
import SocialProofSection from "@/components/landing/beleza/SocialProofSection";
import PricingSection from "@/components/landing/beleza/PricingSection";
import LPFooter from "@/components/landing/beleza/LPFooter";

/**
 * Beleza Landing Page
 * ISOLATED design system for beauty businesses
 * Uses --beleza-* CSS variables (Dark Luxury theme)
 */
const Beleza = () => {
    return (
        <main
            className="min-h-screen font-sans"
            style={{
                backgroundColor: 'hsl(var(--beleza-background))',
                color: 'hsl(var(--beleza-foreground))'
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

export default Beleza;

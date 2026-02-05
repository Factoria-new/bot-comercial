import HeroSection from "@/components/landing/varejo/HeroSection";
import ProblemSection from "@/components/landing/varejo/ProblemSection";
import SolutionSection from "@/components/landing/varejo/SolutionSection";
import BenefitsSection from "@/components/landing/varejo/BenefitsSection";
import SocialProofSection from "@/components/landing/varejo/SocialProofSection";
import PricingSection from "@/components/landing/varejo/PricingSection";
import LPFooter from "@/components/landing/varejo/LPFooter";

/**
 * Varejo Landing Page
 * ISOLATED design system for retail/e-commerce
 * Uses --varejo-* CSS variables (White + Orange impulse theme)
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
                    background-color: hsl(24 95% 53% / 0.2);
                    color: hsl(24 95% 53%);
                }
                @keyframes pulse-cta {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .animate-pulse-cta {
                    animation: pulse-cta 2s ease-in-out infinite;
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

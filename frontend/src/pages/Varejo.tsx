import HeroSection from "@/components/landing/varejo/HeroSection";
import SocialProofSection from "@/components/landing/varejo/SocialProofSection";
import BeforeAfterSection from "@/components/landing/varejo/BeforeAfterSection";
import SolutionSection from "@/components/landing/varejo/SolutionSection";
import BenefitsSection from "@/components/landing/varejo/BenefitsSection";
import IntegrationSection from "@/components/landing/varejo/IntegrationSection";
import PricingSection from "@/components/landing/varejo/PricingSection";
import LPFooter from "@/components/landing/varejo/LPFooter";

/**
 * Varejo Landing Page
 * ISOLATED design system for retail/e-commerce
 * Uses --varejo-* CSS variables (White + Orange impulse theme)
 * 
 * Marketplace-style CRO design with focus on:
 * - URGENCY (24h sales, "Pix Recebido" notifications)
 * - VELOCITY (3-second response times)
 * - SALES (payment links, cart recovery)
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
                @keyframes message-appear {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-message-appear {
                    animation: message-appear 0.3s ease-out;
                }
            `}</style>
            <HeroSection />
            <SocialProofSection />
            <BeforeAfterSection />
            <SolutionSection />
            <BenefitsSection />
            <IntegrationSection />
            <PricingSection />
            <LPFooter />
        </main>
    );
};

export default Varejo;

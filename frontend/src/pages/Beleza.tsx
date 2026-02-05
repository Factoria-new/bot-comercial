import HeroSection from "@/components/landing/beleza/HeroSection";
import SolutionSection from "@/components/landing/beleza/SolutionSection";
import BenefitsSection from "@/components/landing/beleza/BenefitsSection";
import SocialProofSection from "@/components/landing/beleza/SocialProofSection";
import PricingSection from "@/components/landing/beleza/PricingSection";
import LPFooter from "@/components/landing/beleza/LPFooter";
import AudioWaveformSection from "@/components/landing/beleza/AudioWaveformSection";
import HandsGallerySection from "@/components/landing/beleza/HandsGallerySection";
import CalendarTetrisSection from "@/components/landing/beleza/CalendarTetrisSection";

/**
 * Beleza Landing Page
 * ISOLATED design system for beauty businesses
 * Uses --beleza-* CSS variables (Dark Luxury theme)
 * 
 * Section Order:
 * 1. Hero - Main headline and chat demo
 * 2. SocialProof - Trust elements
 * 3. AudioWaveform - Voice/Audio feature
 * 4. HandsGallery - "Maos Livres" carousel
 * 5. Solution - Chat simulator features
 * 6. CalendarTetris - Google Calendar integration
 * 7. Benefits - Feature list
 * 8. Pricing - Plans and CTA
 * 9. Footer
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
            <AudioWaveformSection />
            <HandsGallerySection />
            <SolutionSection />
            <CalendarTetrisSection />
            <BenefitsSection />
            <PricingSection />
            <LPFooter />
        </main>
    );
};

export default Beleza;


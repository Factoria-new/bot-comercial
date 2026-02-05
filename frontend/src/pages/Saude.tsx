import HeroSection from "@/components/landing/saude/HeroSection";
import TrustBar from "@/components/landing/saude/TrustBar";
import ProblemSection from "@/components/landing/saude/ProblemSection";
import SolutionSection from "@/components/landing/saude/SolutionSection";
import IntegrationSection from "@/components/landing/saude/IntegrationSection";
import PricingSection from "@/components/landing/saude/PricingSection";
import LPFooter from "@/components/landing/saude/LPFooter";
import { useState, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SmoothScrollProvider } from "@/contexts/SmoothScrollContext";

/**
 * Saude Landing Page
 * ISOLATED design system for healthcare professionals
 * Uses --saude-* CSS variables (HealthTech theme)
 * Vibe: "Apple Health meets Modern Clinic"
 */
const Saude = () => {
    const [lenis, setLenisInstance] = useState<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 2,
            infinite: false,
        });

        setLenisInstance(lenis);

        // Synchronize Lenis and ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        // Use GSAP ticker for Lenis animation loop
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Disable GSAP lag smoothing for smoother scroll
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(lenis.raf);
            lenis.destroy();
            setLenisInstance(null);
        };
    }, []);

    return (
        <SmoothScrollProvider lenis={lenis || undefined}>
            <main
                className="min-h-screen antialiased"
                style={{
                    backgroundColor: 'hsl(var(--saude-background))',
                    color: 'hsl(var(--saude-foreground))',
                    fontFamily: "'Lato', sans-serif"
                }}
            >
                <style>{`
                    h1, h2, h3, h4, h5, h6 {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    ::selection {
                        background-color: hsl(160 84% 39% / 0.15);
                        color: hsl(160 84% 30%);
                    }
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-slow {
                        animation: fade-in-up 0.8s ease-out forwards;
                    }
                    .delay-100 { animation-delay: 100ms; }
                    .delay-200 { animation-delay: 200ms; }
                    .delay-300 { animation-delay: 300ms; }
                `}</style>
                <HeroSection />
                <TrustBar />
                <ProblemSection />
                <SolutionSection />
                <IntegrationSection />
                <PricingSection />
                <LPFooter />
            </main>
        </SmoothScrollProvider>
    );
};

export default Saude;

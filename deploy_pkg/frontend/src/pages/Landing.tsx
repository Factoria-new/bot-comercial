
import { useRef, useState, useEffect } from "react";
import { TestimonialsSection } from "@/components/testimonials-section";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";

// New Components
import { Header } from "@/components/landing/Header";
import { HeroSection, HeroSectionRef } from "@/components/landing/HeroSection";
import { ProductSection } from "@/components/landing/ProductSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import Lenis from "lenis";

const Landing = () => {
    // Shared state between Header and Hero
    const [phase, setPhase] = useState<'initial' | 'expanded' | 'playing' | 'ended' | 'reversing'>('initial');
    const heroRef = useRef<HeroSectionRef>(null);

    // Handlers passed to Header
    const handleResetToHome = (e: React.MouseEvent) => {
        e.preventDefault();
        if (heroRef.current) {
            heroRef.current.resetToHome();
        }
    };

    const handleNavigate = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        if (heroRef.current) {
            heroRef.current.navigateToSection(sectionId);
        }
    };

    useEffect(() => {
        // Font loading (kept from original)
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link) };
    }, []);

    // Force scroll to top on mount ONLY if no hash (kept logic mostly handled in Hero, but good to ensure)
    useEffect(() => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, []);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }} className="relative">
            {/* Global Interactive Grid Pattern - Active in all phases */}
            <InteractiveGridPattern className="fixed inset-0 opacity-100 z-0" />

            <Header
                phase={phase}
                onResetHome={handleResetToHome}
                onNavigate={handleNavigate}
            />

            <HeroSection
                ref={heroRef}
                phase={phase}
                setPhase={setPhase}
            />

            {/* Content visible only after Hero animation ends */}
            {phase === 'ended' && (
                <div className="relative isolate bg-transparent">
                    <div className="relative z-10">
                        <AboutSection />
                        <ProductSection />
                        <TestimonialsSection />
                        <PricingSection />
                    </div>
                    <Footer />
                </div>
            )}
        </div>
    );
};

export default Landing;

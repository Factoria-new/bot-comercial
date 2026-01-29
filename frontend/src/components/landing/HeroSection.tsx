import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Calendar } from "lucide-react";
import { ChatOverlay } from "@/components/chat-overlay";
import { useSmoothScroll } from "@/contexts/SmoothScrollContext";

gsap.registerPlugin(ScrollTrigger);

export interface HeroSectionRef {
    resetToHome: () => void;
    navigateToSection: (sectionId: string) => void;
    skipToPricing: () => void;
}

interface HeroSectionProps {
    phase: 'initial' | 'expanded' | 'playing' | 'ended' | 'reversing';
    setPhase: (phase: 'initial' | 'expanded' | 'playing' | 'ended' | 'reversing') => void;
}

export const HeroSection = forwardRef<HeroSectionRef, HeroSectionProps>(({ phase, setPhase }, ref) => {
    const { lenis } = useSmoothScroll();
    const { scrollY } = useScroll();
    const metricsOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const metricsY = useTransform(scrollY, [0, 300], [0, -80]);

    const videoWrapperRef = useRef<HTMLDivElement>(null);
    const videoLoopRef = useRef<HTMLVideoElement>(null);
    const videoMainRef = useRef<HTMLVideoElement>(null);
    const videoReverseRef = useRef<HTMLVideoElement>(null);
    const videoEndLoopRef = useRef<HTMLVideoElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);

    const isAnimatingRef = useRef(false);
    const reverseAnimationRef = useRef<number | null>(null);
    const zoomLevelRef = useRef(1);
    const zoomEndLevelRef = useRef(1);
    const initialMobileRectRef = useRef<DOMRect | null>(null);
    const touchStartYRef = useRef<number>(0);
    const maxZoom = 1.05;
    const zoomStep = 0.015;
    const [isShrinking, setIsShrinking] = useState(false);
    const [isInstantReset, setIsInstantReset] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initial setup on mount
    useEffect(() => {
        const wrapper = videoWrapperRef.current;
        if (wrapper) {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                // Mobile: Relative positioning in flex flow
                gsap.set(wrapper, {
                    position: "relative",
                    width: "90vw",
                    height: "45vh",
                    top: "auto",
                    right: "auto",
                    left: "auto",
                    marginTop: "1rem",
                    marginBottom: "2rem",
                    borderRadius: "30px"
                });
            } else {
                // Desktop: Absolute positioning
                gsap.set(wrapper, {
                    position: "absolute",
                    width: "40vw",
                    height: "70vh",
                    top: "15vh",
                    right: "5vw",
                    borderRadius: "30px"
                });
            }
        }

        // Handle hash navigation on load
        const hash = window.location.hash;
        if (hash) {
            const sectionId = hash.replace('#', '');
            setTimeout(() => {
                // Initialize to ended state if hash present
                const wrapper = videoWrapperRef.current;
                const heroText = heroTextRef.current;
                const videoLoop = videoLoopRef.current;
                const videoMain = videoMainRef.current;
                const videoEndLoop = videoEndLoopRef.current;


                if (wrapper && heroText && videoLoop && videoMain && videoEndLoop) {
                    gsap.set(wrapper, { width: "100vw", height: "100vh", top: "0vh", right: "0vw", borderRadius: "0px" });
                    gsap.set(heroText, { x: -100, autoAlpha: 0 });
                    videoLoop.pause();
                    gsap.set(videoLoop, { autoAlpha: 0 });
                    videoMain.pause();
                    gsap.set(videoMain, { autoAlpha: 0 });
                    videoEndLoop.currentTime = 0;
                    // videoEndLoop.play().catch(() => {}); // Autoplay might be blocked, handled by interaction usually
                    gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });
                    setPhase('ended');
                    zoomEndLevelRef.current = 1;

                    setTimeout(() => {
                        const targetSection = document.getElementById(sectionId);
                        if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }, 100);
        }

    }, []);

    const playReverse = useCallback(() => {
        const videoReverse = videoReverseRef.current;
        const videoEndLoop = videoEndLoopRef.current;
        const videoLoop = videoLoopRef.current;

        if (!videoReverse || !videoEndLoop || !videoLoop) return;

        videoEndLoop.pause();
        gsap.set(videoEndLoop, { autoAlpha: 0 });

        videoReverse.currentTime = videoReverse.duration;
        gsap.set(videoReverse, { autoAlpha: 1 });

        setPhase('reversing');

        const reverseSpeed = 0.5;
        let lastTime = performance.now();

        const animateReverse = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            if (videoReverse.currentTime > 0) {
                videoReverse.currentTime = Math.max(0, videoReverse.currentTime - (deltaTime * reverseSpeed));
                reverseAnimationRef.current = requestAnimationFrame(animateReverse);
            } else {
                gsap.set(videoReverse, { autoAlpha: 0 });
                // Garantir que o vídeo de loop volte a tocar
                videoLoop.currentTime = 0;
                videoLoop.play();
                gsap.set(videoLoop, { autoAlpha: 1 });
                setPhase('expanded');
                reverseAnimationRef.current = null;
            }
        };

        reverseAnimationRef.current = requestAnimationFrame(animateReverse);
    }, [setPhase]);

    useEffect(() => {
        return () => {
            if (reverseAnimationRef.current) cancelAnimationFrame(reverseAnimationRef.current);
        }
    }, [])

    // Touch Start Handler
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartYRef.current = e.touches[0].clientY;
        };
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        return () => window.removeEventListener('touchstart', handleTouchStart);
    }, []);

    // Interaction Handler
    useEffect(() => {
        const handleInteraction = (e: Event) => {
            if (isAnimatingRef.current) {
                e.preventDefault();
                return;
            }

            const wrapper = videoWrapperRef.current;
            const heroText = heroTextRef.current;
            const videoLoop = videoLoopRef.current;
            const videoMain = videoMainRef.current;

            if (!wrapper || !heroText || !videoLoop || !videoMain) return;

            let deltaY = 0;
            if (e.type === 'wheel') {
                deltaY = (e as WheelEvent).deltaY;
            } else if (e.type === 'touchmove') {
                const touchEndY = (e as TouchEvent).touches[0].clientY;
                deltaY = touchStartYRef.current - touchEndY;
                touchStartYRef.current = touchEndY; // Update for continuous movement
            }

            const isScrollUp = deltaY < 0;

            // FASE 1: Initial -> Expanded
            if (phase === 'initial') {
                if (isScrollUp) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                isAnimatingRef.current = true;
                const isMobile = window.innerWidth < 768;

                const tl = gsap.timeline({
                    onComplete: () => {
                        isAnimatingRef.current = false;
                        setPhase('expanded');
                    }
                });

                if (isMobile) {
                    // Mobile FLIP: Lock to current position before expanding
                    const rect = wrapper.getBoundingClientRect();
                    initialMobileRectRef.current = rect; // Store for reverse animation

                    gsap.set(wrapper, {
                        position: "fixed",
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        marginTop: 0,
                        marginBottom: 0,
                        zIndex: 50
                    });

                    tl.to(wrapper, {
                        width: "100vw",
                        height: "100vh",
                        top: 0,
                        left: 0,
                        right: 0,
                        borderRadius: "0px",
                        duration: 1.5,
                        ease: "power2.inOut"
                    }, 0);
                } else {
                    // Desktop: Standard expansion
                    tl.to(wrapper, {
                        width: "100vw",
                        height: "100vh",
                        top: "0vh",
                        right: "0vw",
                        borderRadius: "0px",
                        duration: 1.5,
                        ease: "power2.inOut"
                    }, 0);
                }

                tl.to(heroText, {
                    x: isMobile ? 0 : -100, // No slide on mobile, just fade
                    autoAlpha: 0,
                    duration: 1.0
                }, 0);

                return;
            }

            // FASE 2: Expanded -> Zoom e Playing
            if (phase === 'expanded') {
                e.preventDefault();
                const isMobile = window.innerWidth < 768;

                if (isScrollUp) {
                    if (zoomLevelRef.current > 1) {
                        zoomLevelRef.current = Math.max(1, zoomLevelRef.current - zoomStep);
                        gsap.to(videoLoop, {
                            scale: zoomLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        isAnimatingRef.current = true;
                        setIsShrinking(true);

                        const tl = gsap.timeline({
                            onComplete: () => {
                                isAnimatingRef.current = false;
                                setPhase('initial');
                                setIsShrinking(false);

                                if (isMobile) {
                                    // Reset to flow layout after animation finishes
                                    gsap.set(wrapper, {
                                        position: "relative",
                                        top: "auto",
                                        left: "auto",
                                        right: "auto",
                                        width: "90vw",
                                        height: "45vh",
                                        marginTop: "1rem",
                                        marginBottom: "2rem",
                                        zIndex: "auto"
                                    });
                                }
                            }
                        });

                        if (isMobile && initialMobileRectRef.current) {
                            // Mobile Reverse FLIP: Animate to stored coordinates while keeping Fixed
                            const target = initialMobileRectRef.current;
                            tl.to(wrapper, {
                                width: target.width,
                                height: target.height,
                                top: target.top,
                                left: target.left,
                                borderRadius: "30px",
                                duration: 1.5,
                                ease: "power2.inOut"
                            }, 0);
                        } else {
                            // Desktop or Fallback
                            tl.to(wrapper, {
                                position: isMobile ? "relative" : "absolute",
                                width: isMobile ? "90vw" : "40vw",
                                height: isMobile ? "45vh" : "70vh",
                                top: isMobile ? "auto" : "15vh",
                                right: isMobile ? "auto" : "5vw",
                                marginTop: isMobile ? "1rem" : "0",
                                marginBottom: isMobile ? "2rem" : "0",
                                borderRadius: "30px",
                                duration: 1.5,
                                ease: "power2.inOut",
                                zIndex: "auto"
                            }, 0);
                        }

                        tl.to(heroText, {
                            x: 0,
                            autoAlpha: 1,
                            duration: 1.0
                        }, 0);
                    }
                } else {
                    if (zoomLevelRef.current < maxZoom) {
                        zoomLevelRef.current = Math.min(maxZoom, zoomLevelRef.current + zoomStep);
                        gsap.to(videoLoop, {
                            scale: zoomLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        isAnimatingRef.current = true;

                        gsap.set(videoLoop, { autoAlpha: 0 });
                        gsap.set(videoMain, { autoAlpha: 1 });
                        videoMain.currentTime = 0;
                        videoMain.play().catch(console.error);

                        zoomLevelRef.current = 1;
                        gsap.set(videoLoop, { scale: 1 });

                        isAnimatingRef.current = false;
                        setPhase('playing');
                    }
                }

                return;
            }

            // FASE 3: Playing
            if (phase === 'playing') {
                e.preventDefault();
                return;
            }

            // FASE 4: Ended
            if (phase === 'ended') {
                const videoEndLoop = videoEndLoopRef.current;
                const isAtTop = window.scrollY < 100;

                if (isScrollUp && isAtTop) {
                    e.preventDefault();
                    if (zoomEndLevelRef.current > 1) {
                        zoomEndLevelRef.current = Math.max(1, zoomEndLevelRef.current - zoomStep);
                        gsap.to(videoEndLoop, {
                            scale: zoomEndLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        zoomEndLevelRef.current = 1;
                        gsap.set(videoEndLoop, { scale: 1 });
                        playReverse();
                    }
                } else if (!isScrollUp) {
                    if (zoomEndLevelRef.current < maxZoom && isAtTop) {
                        e.preventDefault();
                        zoomEndLevelRef.current = Math.min(maxZoom, zoomEndLevelRef.current + zoomStep);
                        gsap.to(videoEndLoop, {
                            scale: zoomEndLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        // Release scroll: Switch to absolute so it scrolls away
                        gsap.set(wrapper, { position: "absolute", top: 0 });
                    }
                }
                return;
            }

            // FASE 5: Reversing
            if (phase === 'reversing') {
                e.preventDefault();
                return;
            }
        };

        window.addEventListener('wheel', handleInteraction, { passive: false });
        window.addEventListener('touchmove', handleInteraction, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleInteraction);
            window.removeEventListener('touchmove', handleInteraction);
        };
    }, [phase, playReverse, setPhase]);

    // Handle video end
    useEffect(() => {
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!videoMain || !videoEndLoop) return;

        const handleEnded = () => {
            videoEndLoop.currentTime = 0;
            videoEndLoop.play();
            gsap.set(videoEndLoop, { autoAlpha: 1 });
            gsap.set(videoMain, { autoAlpha: 0 });
            setIsInstantReset(false);
            setPhase('ended');
        };

        videoMain.addEventListener('ended', handleEnded);
        return () => videoMain.removeEventListener('ended', handleEnded);
    }, [setPhase, isMobile]);

    // Expose actions to parent
    useImperativeHandle(ref, () => ({
        resetToHome: () => {
            const wrapper = videoWrapperRef.current;
            const heroText = heroTextRef.current;
            const videoLoop = videoLoopRef.current;
            const videoMain = videoMainRef.current;
            const videoEndLoop = videoEndLoopRef.current;
            const videoReverse = videoReverseRef.current;

            if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

            // 1. Parar animações
            isAnimatingRef.current = false;
            if (reverseAnimationRef.current) {
                cancelAnimationFrame(reverseAnimationRef.current);
                reverseAnimationRef.current = null;
            }

            // 2. Resetar vídeos
            videoMain.pause();
            videoMain.currentTime = 0;
            gsap.set(videoMain, { autoAlpha: 0 });

            videoEndLoop.pause();
            videoEndLoop.currentTime = 0;
            gsap.set(videoEndLoop, { autoAlpha: 0 });

            if (videoReverse) {
                videoReverse.pause();
                videoReverse.currentTime = 0;
                gsap.set(videoReverse, { autoAlpha: 0 });
            }

            videoLoop.currentTime = 0;
            videoLoop.play();
            gsap.set(videoLoop, { autoAlpha: 1, scale: 1 });

            // 3. Resetar layout
            gsap.set(heroText, { x: 0, autoAlpha: 1 });

            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                gsap.set(wrapper, {
                    position: "relative",
                    width: "90vw",
                    height: "45vh",
                    top: "auto",
                    right: "auto",
                    left: "auto",
                    marginTop: "1rem",
                    marginBottom: "2rem",
                    borderRadius: "30px",
                    zIndex: "auto"
                });
            } else {
                gsap.set(wrapper, {
                    position: "absolute",
                    width: "40vw",
                    height: "70vh",
                    top: "15vh",
                    right: "5vw",
                    borderRadius: "30px"
                });
            }

            // 4. Resetar estados
            zoomLevelRef.current = 1;
            zoomEndLevelRef.current = 1;
            setIsInstantReset(true);
            setPhase('initial');
            setPhase('initial');
            setPhase('initial');
            setTimeout(() => {
                if (lenis) {
                    lenis.resize(); // Force recalculation of dimensions
                    ScrollTrigger.refresh(); // Ensure pin spacers are calculated
                    lenis.scrollTo(0, { duration: 1.2, force: true });
                } else {
                    ScrollTrigger.refresh();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
        },

        navigateToSection: (sectionId: string) => {
            const wrapper = videoWrapperRef.current;
            const heroText = heroTextRef.current;
            const videoLoop = videoLoopRef.current;
            const videoMain = videoMainRef.current;
            const videoEndLoop = videoEndLoopRef.current;

            if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

            isAnimatingRef.current = false;
            if (reverseAnimationRef.current) {
                cancelAnimationFrame(reverseAnimationRef.current);
                reverseAnimationRef.current = null;
            }

            gsap.set(wrapper, { width: "100vw", height: "100vh", top: "0vh", right: "0vw", borderRadius: "0px" });
            gsap.set(heroText, { x: -100, autoAlpha: 0 });

            videoLoop.pause();
            gsap.set(videoLoop, { autoAlpha: 0 });
            videoMain.pause();
            gsap.set(videoMain, { autoAlpha: 0 });

            videoEndLoop.currentTime = 0;
            videoEndLoop.play();
            gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

            setPhase('ended');
            zoomEndLevelRef.current = 1;

            setTimeout(() => {
                if (lenis) {
                    lenis.resize();
                    ScrollTrigger.refresh();
                    lenis.scrollTo('#' + sectionId, { duration: 1.2, force: true, offset: -100 });
                } else {
                    ScrollTrigger.refresh();
                    const targetSection = document.getElementById(sectionId);
                    if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 800);
        },

        skipToPricing: () => {
            const wrapper = videoWrapperRef.current;
            const heroText = heroTextRef.current;
            const videoLoop = videoLoopRef.current;
            const videoMain = videoMainRef.current;
            const videoEndLoop = videoEndLoopRef.current;

            if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

            isAnimatingRef.current = false;
            if (reverseAnimationRef.current) {
                cancelAnimationFrame(reverseAnimationRef.current);
            }

            gsap.set(wrapper, { width: "100vw", height: "100vh", top: "0vh", right: "0vw", borderRadius: "0px" });
            gsap.set(heroText, { x: -100, autoAlpha: 0 });
            videoLoop.pause();
            gsap.set(videoLoop, { autoAlpha: 0 });
            videoMain.pause();
            gsap.set(videoMain, { autoAlpha: 0 });
            videoEndLoop.currentTime = 0;
            videoEndLoop.play();
            gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

            setPhase('ended');
            zoomEndLevelRef.current = 1;

            setTimeout(() => {
                if (lenis) {
                    lenis.resize();
                    ScrollTrigger.refresh();
                    lenis.scrollTo('#pricing', { duration: 1.2, force: true, offset: -50 });
                } else {
                    ScrollTrigger.refresh();
                    const pricingSection = document.getElementById('pricing');
                    if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 800);
        }
    }));

    // Handle clicking the "Começar Agora" button embedded in the Hero Text
    const handleSkipClick = () => {
        // Internal call to skipToPricing logic via ref is not needed, just call the logic directly?
        // But skipToPricing is now exposed via ref...
        // Actually I can just refactor the skip logic into a local function and call it from the exposed handle AND the button.
        if (ref && 'current' in ref && ref.current) {
            (ref.current as HeroSectionRef).skipToPricing();
        } else {
            // Fallback if ref is tricky to access from inside (it shouldn't be, but easier to just duplicate or move logic)
            // Better: Move logic to a function `executeSkipToPricing` inside component and call it.
            executeSkipToPricing();
        }
    };

    const transitionToSection = (sectionId: string) => {
        const wrapper = videoWrapperRef.current;
        const heroText = heroTextRef.current;
        const videoLoop = videoLoopRef.current;
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

        isAnimatingRef.current = false;
        if (reverseAnimationRef.current) {
            cancelAnimationFrame(reverseAnimationRef.current);
            reverseAnimationRef.current = null;
        }

        gsap.set(wrapper, { width: "100vw", height: "100vh", top: "0vh", right: "0vw", borderRadius: "0px" });
        gsap.set(heroText, { x: -100, autoAlpha: 0 });

        videoLoop.pause();
        gsap.set(videoLoop, { autoAlpha: 0 });
        videoMain.pause();
        gsap.set(videoMain, { autoAlpha: 0 });

        videoEndLoop.currentTime = 0;
        videoEndLoop.play().catch(() => { });
        gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

        setPhase('ended');
        zoomEndLevelRef.current = 1;

        setTimeout(() => {
            if (lenis) {
                lenis.resize();
                ScrollTrigger.refresh();
                lenis.scrollTo('#' + sectionId, { duration: 1.2, force: true, offset: -100 });
            } else {
                ScrollTrigger.refresh();
                const targetSection = document.getElementById(sectionId);
                if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 1000);
    };

    const executeSkipToPricing = () => transitionToSection('pricing');


    return (
        <div className="relative min-h-screen flex flex-col md:block">
            {/* Texto Hero (Lado Esquerdo) */}
            <div
                ref={heroTextRef}
                className="relative md:absolute top-0 left-0 w-full md:w-[60vw] lg:w-[50vw] h-auto md:h-screen flex flex-col justify-start md:justify-center pt-20 md:pt-28 pb-2 px-6 md:pl-16 z-10 pointer-events-none md:pointer-events-auto order-1 md:order-none"
            >
                <h1 className="text-3xl md:text-[clamp(2.5rem,5vw,6rem)] font-extrabold text-[#1E293B] leading-tight drop-shadow-lg text-left w-full break-normal lg:break-words">
                    Seu Atendente IA em todos os seus canais,{' '}
                    <span className="text-[#00A947] block mt-2">Vendas 24 horas</span>
                </h1>

                <p className="text-gray-600 text-left mt-3 md:mt-8 text-base md:text-[clamp(1.25rem,2vw,1.5rem)] w-full max-w-2xl mr-auto leading-relaxed">
                    Nunca mais perca um cliente por demora. IA que atende, agenda e vende enquanto você dorme.
                </p>

                {/* Botões CTA */}
                <div className="flex flex-wrap gap-3 md:gap-4 mt-5 md:mt-8 pointer-events-auto">
                    <Button
                        onClick={executeSkipToPricing}
                        className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-4 md:px-8 md:py-6 text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        Começar Agora
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => transitionToSection('produto')}
                        className="border-2 border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white font-semibold px-6 py-4 md:px-8 md:py-6 text-base md:text-lg rounded-full transition-all"
                    >
                        Ver Como Funciona
                    </Button>
                </div>
            </div>

            {/* Wrapper do Vídeo */}
            <div
                ref={videoWrapperRef}
                className="relative md:absolute bg-black overflow-hidden shadow-2xl z-20 mx-auto md:mx-0 order-2 md:order-none"
                style={{ willChange: 'width, height, top, right, border-radius' }}
            >
                {/* Vídeo Loop Inicial */}
                <video
                    key={isMobile ? 'mobile-loop' : 'desktop-loop'}
                    ref={videoLoopRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ opacity: 1 }}
                >
                    <source src={isMobile ? "/videos-scroll/NAVIGATE_4K_9x16_S40_loop@sm.mp4" : "/videos-scroll/NAVIGATE_4K_S40_loop@md.mp4"} type="video/mp4" />
                </video>

                {/* Vídeo Principal (toca após expansão) */}
                <video
                    key={isMobile ? 'mobile-main' : 'desktop-main'}
                    ref={videoMainRef}
                    muted
                    playsInline
                    preload="auto"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ opacity: 0 }}
                >
                    <source src={isMobile ? "/videos-scroll/NAVIGATE_4K_9x16_S40-scrolly@sm.mp4" : "/videos-scroll/NAVIGATE_4K_S40-scrolly@md.mp4"} type="video/mp4" />
                </video>

                {/* Vídeo Reverso (otimizado para seek) */}
                <video
                    key={isMobile ? 'mobile-reverse' : 'desktop-reverse'}
                    ref={videoReverseRef}
                    muted
                    playsInline
                    preload="auto"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ opacity: 0 }}
                >
                    <source src={isMobile ? "/videos-scroll/NAVIGATE_4K_9x16_S40-scrolly@sm_OPTIMIZED.mp4" : "/videos-scroll/NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4"} type="video/mp4" />
                </video>

                {/* Vídeo Loop Final */}
                <video
                    key={isMobile ? 'mobile-end' : 'desktop-end'}
                    ref={videoEndLoopRef}
                    loop
                    muted
                    preload="auto"
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ opacity: 0 }}
                >
                    <source src={isMobile ? "/videos-scroll/NAVIGATE_4K_9x16_S50_loop@sm.mp4" : "/videos-scroll/NAVIGATE_4K_S50_loop@md.mp4"} type="video/mp4" />
                </video>

                {/* Chat Overlay - Only visible in expanded phase (100% screen) */}
                <AnimatePresence>
                    {phase === 'expanded' && !isShrinking && <ChatOverlay />}
                </AnimatePresence>

                {/* Overlay de Métricas - AnimatePresence controla a saída */}
                <AnimatePresence mode={isInstantReset ? "sync" : "wait"}>
                    {phase === 'ended' && (
                        <motion.div
                            key="metrics-overlay"
                            className="absolute top-24 md:top-32 left-0 w-full z-30 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: isInstantReset ? 0 : 0, transition: { duration: isInstantReset ? 0 : 0.3 } }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className="flex flex-col gap-4 items-center md:items-start justify-center md:justify-start w-full"
                                style={{ y: metricsY, maxWidth: isMobile ? "90%" : "50%", margin: isMobile ? "0 auto" : "0 0 0 3vw" }}
                            >
                                <motion.div style={{ opacity: metricsOpacity }} className="flex flex-col gap-2">
                                    <div className="group flex justify-center w-full">
                                        <h1
                                            className="text-[clamp(2.5rem,7vw,5rem)] font-clash font-bold text-[#1E293B] text-center tracking-widest leading-[1.1] group-hover:scale-105 transition-transform duration-500"
                                            style={{ wordSpacing: '0.5em' }}
                                        >
                                            MÉTRICAS EM TEMPO REAL
                                        </h1>
                                    </div>

                                    <div className="group flex justify-center w-full">
                                        <p className="text-[clamp(0.75rem,2vw,1rem)] font-clash font-bold text-[#1E293B]/70 text-center tracking-[0.2em] uppercase group-hover:translate-y-1 transition-transform duration-300">
                                            +100% ATENDIMENTO AUTOMÁTICO
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Animated Arrow Cards */}
                                <div className="hidden md:flex flex-col gap-6 mt-[15vh] w-full max-w-[350px] md:max-w-[420px] self-start ml-4 md:ml-20">
                                    {[
                                        { icon: Users, color: "bg-[#027831]", value: "+150%", label: "Leads", width: "100%" },
                                        { icon: MessageSquare, color: "bg-[#6366F1]", value: "+80%", label: "Respostas", width: "85%" },
                                        { icon: Calendar, color: "bg-[#EAB308]", value: "+3x", label: "Agendamentos", width: "70%" }
                                    ].map((Item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, width: "141px" }}
                                            animate={{ opacity: 1, width: Item.width }}
                                            transition={{
                                                opacity: {
                                                    delay: i * 0.2 + 0.2,
                                                    duration: 0.5
                                                },
                                                width: {
                                                    delay: i * 0.2 + 0.8,
                                                    duration: 1.5,
                                                    ease: [0.16, 1, 0.3, 1]
                                                }
                                            }}
                                            className="flex items-center h-20 md:h-24 group/card cursor-pointer"
                                        >
                                            {/* Main Body (Animates Width) */}
                                            <div
                                                className="flex-1 bg-[#0F172A] h-full rounded-l-2xl flex items-center pl-4 gap-5 z-20 shadow-xl group-hover/card:bg-[#1E293B] transition-colors duration-300 relative overflow-hidden"
                                            >
                                                {/* Icon (Always Visible) */}
                                                <div className={`w-12 h-12 md:w-16 md:h-16 ${Item.color} rounded-3xl flex items-center justify-center shrink-0 shadow-inner z-30`}>
                                                    <Item.icon className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" strokeWidth={2.5} />
                                                </div>

                                                {/* Text (Fades In) */}
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        delay: i * 0.2 + 1.2,
                                                        duration: 1.2
                                                    }}
                                                    className="flex flex-col leading-none gap-1 min-w-max pr-6"
                                                >
                                                    <span className="text-white font-clash font-bold text-3xl md:text-4xl">{Item.value}</span>
                                                    <span className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">{Item.label}</span>
                                                </motion.div>
                                            </div>

                                            {/* Arrow Tip (Pushed by Body) */}
                                            <svg
                                                className="h-full w-[32px] shrink-0 fill-[#0F172A] group-hover/card:fill-[#1E293B] transition-colors duration-300 pointer-events-none -ml-[1px]"
                                                viewBox="0 0 32 100"
                                                preserveAspectRatio="none"
                                            >
                                                <path d="M0,0 L0,100 L25,58 Q32,50 25,42 L0,0 Z" />
                                            </svg>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >
        </div>
    );
});

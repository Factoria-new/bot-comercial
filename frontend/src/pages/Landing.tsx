import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, MessageSquare, Calendar } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PricingWrapper, Heading, Price } from "@/components/ui/animated-pricing-cards";
import { TestimonialsSection } from "@/components/testimonials-section";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";
import { ChatOverlay } from "@/components/chat-overlay";


gsap.registerPlugin(ScrollTrigger);

const bgFeature1 = "/images/Cachorro.jpg";



const Landing = () => {
    const { scrollY } = useScroll();
    const metricsOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const metricsY = useTransform(scrollY, [0, 300], [0, -80]);

    const videoWrapperRef = useRef<HTMLDivElement>(null);
    const videoLoopRef = useRef<HTMLVideoElement>(null);
    const videoMainRef = useRef<HTMLVideoElement>(null);
    const videoReverseRef = useRef<HTMLVideoElement>(null);
    const videoEndLoopRef = useRef<HTMLVideoElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);

    // Estados da animação
    const [phase, setPhase] = useState<'initial' | 'expanded' | 'playing' | 'ended' | 'reversing'>('initial');
    const isAnimatingRef = useRef(false);
    const reverseAnimationRef = useRef<number | null>(null);
    const zoomLevelRef = useRef(1);
    const zoomEndLevelRef = useRef(1);
    const maxZoom = 1.05;
    const zoomStep = 0.015;
    const [isScrolled, setIsScrolled] = useState(false);
    const [isShrinking, setIsShrinking] = useState(false);
    const [isInstantReset, setIsInstantReset] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
    const [isFanOpen, setIsFanOpen] = useState(true);

    // Responsive pricing positions
    const [pricingVideoPosition, setPricingVideoPosition] = useState('30%');
    const [pricingCardsPosition, setPricingCardsPosition] = useState('75%');

    // Update positions based on screen size
    useEffect(() => {
        const updatePositions = () => {
            const width = window.innerWidth;
            if (width < 768) {
                // Mobile: centered layout
                setPricingVideoPosition('50%');
                setPricingCardsPosition('50%');
            } else if (width < 1024) {
                // Tablet
                setPricingVideoPosition('35%');
                setPricingCardsPosition('70%');
            } else {
                // Desktop
                setPricingVideoPosition('21%');
                setPricingCardsPosition('75%');
            }
        };

        updatePositions();
        window.addEventListener('resize', updatePositions);
        return () => window.removeEventListener('resize', updatePositions);
    }, []);

    const handleToggle = (period: 'monthly' | 'semiannual' | 'annual') => {
        if (!isFanOpen || pricingPeriod === period) return; // Prevent double clicks and same state

        // 1. Fan In
        setIsFanOpen(false);

        // 2. Start Spin (Wait for Fan In)
        setTimeout(() => {
            setRotation(prev => prev + 360);
        }, 400);

        // 3. Swap Content (At 270deg - 75% of 600ms spin = 450ms)
        // Total delay = 400 + 450 = 850
        setTimeout(() => {
            setPricingPeriod(period);
        }, 850);

        // 4. Fan Out (After spin completes)
        setTimeout(() => {
            setIsFanOpen(true);
        }, 1100); // 400 + 700 (padding)
    };

    useEffect(() => {
        // Force scroll to top on mount ONLY if no hash
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const hash = window.location.hash;
        if (hash) {
            // Se tiver hash (ex: #pricing), preparar a página imediatamente
            const sectionId = hash.replace('#', '');

            // Pequeno delay para garantir que refs estão prontos
            setTimeout(() => {
                const wrapper = videoWrapperRef.current;
                const heroText = heroTextRef.current;
                const videoLoop = videoLoopRef.current;
                const videoMain = videoMainRef.current;
                const videoEndLoop = videoEndLoopRef.current;

                if (wrapper && heroText && videoLoop && videoMain && videoEndLoop) {
                    // 1. Estado visual final (Expanded)
                    gsap.set(wrapper, {
                        width: "100vw",
                        height: "100vh",
                        top: "0vh",
                        right: "0vw",
                        borderRadius: "0px"
                    });

                    gsap.set(heroText, { x: -100, autoAlpha: 0 });

                    // 2. Configurar vídeos
                    videoLoop.pause();
                    gsap.set(videoLoop, { autoAlpha: 0 });
                    videoMain.pause();
                    gsap.set(videoMain, { autoAlpha: 0 });
                    videoEndLoop.currentTime = 0;
                    videoEndLoop.play().catch(() => { }); // Catch autoplay errors
                    gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

                    // 3. Estado React
                    setPhase('ended');
                    zoomEndLevelRef.current = 1;

                    // 4. Scroll para a seção
                    setTimeout(() => {
                        const targetSection = document.getElementById(sectionId);
                        if (targetSection) {
                            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            }, 100);

        } else {
            window.scrollTo(0, 0);
        }

        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link) };
    }, []);

    useEffect(() => {
        const wrapper = videoWrapperRef.current;
        if (wrapper) {
            const isMobile = window.innerWidth < 768;
            gsap.set(wrapper, {
                width: isMobile ? "90vw" : "40vw",
                height: isMobile ? "50vh" : "70vh",
                top: isMobile ? "40vh" : "15vh",
                right: "5vw",
                borderRadius: "30px"
            });
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

        const reverseSpeed = 1;
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
    }, []);

    useEffect(() => {
        return () => {
            if (reverseAnimationRef.current) {
                cancelAnimationFrame(reverseAnimationRef.current);
            }
        };
    }, []);

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

            const wheelEvent = e as WheelEvent;
            const isScrollUp = wheelEvent.deltaY < 0;

            // FASE 1: Initial -> Expanded
            if (phase === 'initial') {
                if (isScrollUp) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                isAnimatingRef.current = true;

                const tl = gsap.timeline({
                    onComplete: () => {
                        isAnimatingRef.current = false;
                        setPhase('expanded');
                    }
                });

                tl.to(wrapper, {
                    width: "100vw",
                    height: "100vh",
                    top: "0vh",
                    right: "0vw",
                    borderRadius: "0px",
                    duration: 1.5,
                    ease: "power2.inOut"
                }, 0);

                tl.to(heroText, {
                    x: -100,
                    autoAlpha: 0,
                    duration: 1.0
                }, 0);

                return;
            }

            // FASE 2: Expanded -> Zoom e Playing
            if (phase === 'expanded') {
                e.preventDefault();

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
                            }
                        });

                        tl.to(wrapper, {
                            width: "40vw",
                            height: "70vh",
                            top: "15vh",
                            right: "5vw",
                            borderRadius: "30px",
                            duration: 1.5,
                            ease: "power2.inOut"
                        }, 0);

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
                        videoMain.play();

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
    }, [phase, playReverse]);

    useEffect(() => {
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!videoMain || !videoEndLoop) return;

        const handleEnded = () => {
            videoEndLoop.currentTime = 0;
            videoEndLoop.play();
            gsap.set(videoEndLoop, { autoAlpha: 1 });
            gsap.set(videoMain, { autoAlpha: 0 });
            setIsInstantReset(false); // Resetar para usar animação normal
            setPhase('ended');
        };

        videoMain.addEventListener('ended', handleEnded);
        videoMain.addEventListener('ended', handleEnded);
        return () => videoMain.removeEventListener('ended', handleEnded);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSkipToPricing = () => {
        const wrapper = videoWrapperRef.current;
        const heroText = heroTextRef.current;
        const videoLoop = videoLoopRef.current;
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

        // 1. Parar animações em andamento
        isAnimatingRef.current = false;
        if (reverseAnimationRef.current) {
            cancelAnimationFrame(reverseAnimationRef.current);
        }

        // 2. Definir estado visual final (Expanded)
        gsap.set(wrapper, {
            width: "100vw",
            height: "100vh",
            top: "0vh",
            right: "0vw",
            borderRadius: "0px"
        });

        gsap.set(heroText, {
            x: -100,
            autoAlpha: 0
        });

        // 3. Configurar vídeos para o estado final
        videoLoop.pause();
        gsap.set(videoLoop, { autoAlpha: 0 });

        videoMain.pause();
        gsap.set(videoMain, { autoAlpha: 0 });

        videoEndLoop.currentTime = 0;
        videoEndLoop.play();
        gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

        // 4. Atualizar estado React
        setPhase('ended');
        zoomEndLevelRef.current = 1;

        // 5. Scroll para pricing após renderização
        setTimeout(() => {
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };
    // Handler para navegação para seções sem bloquear o scroll
    const handleNavigateToSection = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();

        const wrapper = videoWrapperRef.current;
        const heroText = heroTextRef.current;
        const videoLoop = videoLoopRef.current;
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

        // 1. Parar animações em andamento imediatamente
        isAnimatingRef.current = false;
        if (reverseAnimationRef.current) {
            cancelAnimationFrame(reverseAnimationRef.current);
            reverseAnimationRef.current = null;
        }

        // 2. Definir estado visual final (Expanded) instantaneamente
        gsap.set(wrapper, {
            width: "100vw",
            height: "100vh",
            top: "0vh",
            right: "0vw",
            borderRadius: "0px"
        });

        gsap.set(heroText, {
            x: -100,
            autoAlpha: 0
        });

        // 3. Configurar vídeos para o estado final
        videoLoop.pause();
        gsap.set(videoLoop, { autoAlpha: 0 });

        videoMain.pause();
        gsap.set(videoMain, { autoAlpha: 0 });

        videoEndLoop.currentTime = 0;
        videoEndLoop.play();
        gsap.set(videoEndLoop, { autoAlpha: 1, scale: 1 });

        // 4. Atualizar estado React
        setPhase('ended');
        zoomEndLevelRef.current = 1;

        // 5. Scroll para a seção imediatamente (sem bloquear) - Com delay para garantir renderização
        setTimeout(() => {
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                // Usar scrollIntoView com behavior 'smooth' mas não bloquear
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleResetToHome = (e: React.MouseEvent) => {
        e.preventDefault();

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

        // 3. Resetar layout (Hero Text e Wrapper)
        gsap.set(heroText, {
            x: 0,
            autoAlpha: 1
        });

        gsap.set(wrapper, {
            width: "40vw",
            height: "70vh",
            top: "15vh",
            right: "5vw",
            borderRadius: "30px"
        });

        // 4. Resetar zoom levels
        zoomLevelRef.current = 1;
        zoomEndLevelRef.current = 1;

        // 5. Ativar reset instantâneo (sem animação de saída)
        setIsInstantReset(true);

        // 6. Atualizar estado React para esconder overlays
        setPhase('initial');

        // 7. Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header - Só o container maior fica transparente */}
            <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl py-3 px-6 flex justify-between items-center rounded-2xl transition-all duration-500 ${phase === 'initial' || (phase === 'ended' && isScrolled)
                ? 'bg-white/80 backdrop-blur-md shadow-lg border border-gray-100'
                : 'bg-transparent shadow-none border-transparent'
                }`}>
                <img src="/logo-header.png" alt="Factoria" className="h-8 md:h-10 w-auto object-contain" />

                {/* Navegação Central - mantém o fundo pill sempre */}
                <nav className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                    <a href="#home" onClick={handleResetToHome} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                        Home
                    </a>
                    <a href="#sobre" onClick={(e) => handleNavigateToSection(e, 'sobre')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                        Sobre Nós
                    </a>
                    <a href="#produto" onClick={(e) => handleNavigateToSection(e, 'produto')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                        Produto
                    </a>
                    <a href="#pricing" onClick={(e) => handleNavigateToSection(e, 'pricing')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                        Preços
                    </a>
                </nav>

                <Link to="/login">
                    <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                        Entrar
                    </Button>
                </Link>
            </header>

            {/* Container Principal */}
            < div className="relative bg-white min-h-screen" >
                {/* Texto Hero (Lado Esquerdo) */}
                <div
                    ref={heroTextRef}
                    className="absolute top-0 left-0 w-full md:w-[60vw] lg:w-[50vw] h-screen flex flex-col justify-start md:justify-center pt-32 md:pt-28 pb-24 px-6 md:pl-16 z-10 pointer-events-none md:pointer-events-auto"
                >
                    {/* Badge */}


                    <h1 className="text-[clamp(2.5rem,5vw,6rem)] font-extrabold text-[#1E293B] leading-tight drop-shadow-lg text-left w-full break-normal lg:break-words">
                        Seu Atendente IA no WhatsApp,{' '}
                        <span className="text-[#00A947] block mt-2">Vendas 24 horas</span>
                    </h1>

                    <p className="text-gray-600 text-left mt-8 text-[clamp(1.25rem,2vw,1.5rem)] w-full max-w-2xl mr-auto leading-relaxed">
                        Nunca mais perca um cliente por demora. IA que atende, agenda e vende enquanto você dorme.
                    </p>

                    {/* Botões CTA */}
                    <div className="flex flex-wrap gap-4 mt-8 pointer-events-auto">
                        <Button
                            onClick={handleSkipToPricing}
                            className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        >
                            Começar Agora
                        </Button>
                        <Button variant="outline" className="border-2 border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white font-semibold px-8 py-6 text-lg rounded-full transition-all">
                            Ver Como Funciona
                        </Button>
                    </div>
                </div >

                {/* Wrapper do Vídeo */}
                < div
                    ref={videoWrapperRef}
                    className="absolute bg-black overflow-hidden shadow-2xl z-20"
                    style={{ willChange: 'width, height, top, right, border-radius' }}
                >
                    {/* Vídeo Loop Inicial */}
                    < video
                        ref={videoLoopRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 1 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40_loop@md.mp4" type="video/mp4" />
                    </video >

                    {/* Vídeo Principal (toca após expansão) */}
                    < video
                        ref={videoMainRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md.mp4" type="video/mp4" />
                    </video >

                    {/* Vídeo Reverso (otimizado para seek) */}
                    < video
                        ref={videoReverseRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4" type="video/mp4" />
                    </video >

                    {/* Vídeo Loop Final */}
                    < video
                        ref={videoEndLoopRef}
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S50_loop@md.mp4" type="video/mp4" />
                    </video >

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
                                    className="flex flex-col gap-4 items-center justify-center w-full"
                                    style={{ y: metricsY, maxWidth: "50%" }}
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
                                    <div className="flex flex-col gap-6 mt-[15vh] w-full max-w-[350px] md:max-w-[420px] self-start ml-4 md:ml-20">
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
            </div >

            {/* Company Section - Sobre Nós */}
            < AboutSection />



            {/* Resto do Site */}
            {
                phase === 'ended' && (
                    <>

                        <section
                            id="produto"
                            className="relative py-24 px-6 md:px-12 bg-[#FFFFFF] text-slate-900 overflow-hidden"
                        >
                            <div className="container mx-auto mb-32" style={{ maxWidth: "100%" }}>
                                {/* Section Header */}
                                <div className="text-center max-w-3xl mx-auto">
                                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                                        Seu Assistente de Vendas <br className="hidden md:block" />
                                        <span>no </span>
                                        <span className="text-[#00A947]">WhatsApp</span>
                                    </h2>
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        Esqueça bots que só respondem FAQ. Nossa IA entende seu negócio, qualifica leads e agenda reuniões automaticamente.
                                    </p>
                                </div>
                            </div>

                            <div className="container mx-auto space-y-96 relative" style={{ maxWidth: "100%" }}>


                                {/* Feature 1: Atendimento Escalável */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-20%" }}
                                    transition={{ duration: 0.9 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="max-w-[100rem]">
                                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                                            Atendimento Escalável
                                        </h3>
                                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                                            Multiplique sua capacidade de atendimento sem contratar mais pessoas. Um bot para cada conversa, todas rodando ao mesmo tempo.
                                        </p>
                                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                                            {["Múltiplas conversas simultâneas", "Respostas instantâneas 24/7", "Escale sem aumentar custos"].map((item, i) => (
                                                <li key={i} className="text-slate-600 font-medium">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-full max-w-6xl aspect-[4/3] bg-feature-green flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl mt-16">
                                        <img
                                            src={bgFeature1}
                                            alt="Atendimento Escalável"
                                            className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                </motion.div>

                                {/* Feature 2: Agente IA Personalizado */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-20%" }}
                                    transition={{ duration: 0.9 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="max-w-[100rem]">
                                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                                            Agente IA Personalizado
                                        </h3>
                                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                                            Configure o prompt do seu bot com a personalidade da sua marca. Ele entende contexto, histórico e responde como seu melhor vendedor.
                                        </p>
                                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                                            {["Prompt 100% personalizável", "Conexão com Google Calendar", "Responde via áudio (TTS)"].map((item, i) => (
                                                <li key={i} className="text-slate-600 font-medium">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#030411] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                                        <img
                                            src="/images/AgentePersonalizado.png"
                                            alt="Agente IA Personalizado"
                                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                </motion.div>

                                {/* Feature 3: Dashboard de Métricas */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-20%" }}
                                    transition={{ duration: 0.9 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="max-w-[100rem]">
                                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                                            Dashboard de Métricas
                                        </h3>
                                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                                            Acompanhe cada conversa, cada lead, cada agendamento. Tudo em tempo real com atualizações automáticas via WebSocket.
                                        </p>
                                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                                            {["Atualizações instantâneas", "Métricas de mensagens e leads", "Pergunte à Lia sobre seus dados"].map((item, i) => (
                                                <li key={i} className="text-slate-600 font-medium">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#0F0A28] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                                        <img
                                            src="/images/DashBoardDeMetricas.png"
                                            alt="Dashboard de Métricas"
                                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                </motion.div>

                                {/* Feature 4: Integrações Poderosas */}
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-20%" }}
                                    transition={{ duration: 0.9 }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="max-w-[100rem]">
                                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                                            Integrações Poderosas
                                        </h3>
                                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                                            Conecte WhatsApp, Instagram e Google Calendar em poucos cliques. Suas conversas e agendamentos sincronizados automaticamente.
                                        </p>
                                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                                            {["WhatsApp Business", "Instagram Direct", "Google Calendar integrado"].map((item, i) => (
                                                <li key={i} className="text-slate-600 font-medium">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#0F172A] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                                        <img
                                            src="/images/Integracoes.png"
                                            alt="Integrações Poderosas"
                                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </section>





                        {/* Testimonials Section */}
                        <TestimonialsSection />

                        {/* Pricing Section */}
                        <section id="pricing" className="relative min-h-screen flex flex-col justify-center px-12 md:px-4 bg-white overflow-hidden">
                            {/* Sticker Container - Rounded with margins */}
                            <div
                                className="relative w-full max-w-[80%] mx-auto h-full min-h-[80vh] overflow-hidden"
                                style={{
                                    borderRadius: '32px',
                                    backgroundColor: '#f25622'
                                }}
                            >
                                {/* Background Video - Inside the sticker */}
                                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '32px' }}>
                                    <div
                                        className="absolute h-full"
                                        style={{
                                            width: 'calc(100% + 60px)',
                                            marginLeft: '-10px',
                                            left: pricingVideoPosition,
                                            transform: 'translateX(-50%)',
                                            clipPath: 'inset(0 10px 0 0)'
                                        }}
                                    >
                                        <video
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: "center center", display: "block" }}
                                        >
                                            <source src="/videos-scroll/NAVIGATE_4K_S10_loop@md.mp4" type="video/mp4" />
                                        </video>
                                    </div>
                                </div>

                                {/* Text on video side */}
                                <div className="absolute z-10" style={{ left: pricingVideoPosition, top: "25%", transform: "translate(-50%, -50%)" }}>
                                    <div className="text-center">
                                        <h2 className="text-[clamp(2rem,5vw,4rem)] font-clash font-bold text-[#1E293B] tracking-[-0.04em] leading-[0.85] mb-4"
                                            style={{ wordSpacing: '0.5em' }}>
                                            ESCOLHA SEU PLANO
                                        </h2>
                                        <p className="text-lg text-slate-800 max-w-md mx-auto font-medium">
                                            Comece hoje e cancele quando quiser. Sem fidelidade, sem burocracia.
                                        </p>
                                        {/* Arrow Video */}
                                        <video
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-24 h-24 mx-auto mt-6"
                                        >
                                            <source src="/videos/arrow.webm" type="video/webm" />
                                        </video>
                                    </div>
                                </div>

                                {/* Cards container */}
                                <div className="container mx-auto relative z-10" style={{ maxWidth: "100%", position: "absolute", left: pricingCardsPosition, top: "50%", transform: "translate(-50%, -50%)", margin: 0 }}>
                                    {/* Period selector - at top */}
                                    <div className="flex justify-center mb-8" style={{ marginTop: "-180px" }}>
                                        <div className="bg-slate-800 p-1 rounded-full flex relative items-center cursor-pointer w-[340px] h-[50px]">
                                            <div
                                                className={`absolute top-1 bottom-1 w-[32%] bg-[#00A947] rounded-full transition-all duration-300 ${pricingPeriod === 'monthly' ? 'left-1' : pricingPeriod === 'semiannual' ? 'left-[34%]' : 'left-[67%]'}`}
                                            />
                                            <div onClick={() => handleToggle('monthly')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                                Mensal
                                            </div>
                                            <div onClick={() => handleToggle('semiannual')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'semiannual' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                                Semestral
                                            </div>
                                            <div onClick={() => handleToggle('annual')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'annual' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                                Anual
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Logic Variables */}
                                    {(() => {
                                        const BASE_PRICE_BASIC = 19.90;
                                        const BASE_PRICE_PRO = 29.90;

                                        const formatCurrency = (value: number) => {
                                            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                        };

                                        const getPrice = (base: number, period: string) => {
                                            if (period === 'monthly') return base;
                                            if (period === 'semiannual') return base * 6;
                                            if (period === 'annual') return base * 10;
                                            return base;
                                        };

                                        const basicPrice = getPrice(BASE_PRICE_BASIC, pricingPeriod);
                                        const proPrice = getPrice(BASE_PRICE_PRO, pricingPeriod);

                                        const formattedBasicPrice = formatCurrency(basicPrice);
                                        const formattedProPrice = formatCurrency(proPrice);

                                        const periodLabel = pricingPeriod === 'monthly' ? '/mês' : pricingPeriod === 'semiannual' ? '/semestre' : '/ano';

                                        return (
                                            <div className="flex flex-col items-center justify-center gap-8 md:flex-row flex-wrap relative h-[600px] w-full">
                                                <motion.div
                                                    animate={{
                                                        x: isFanOpen ? 0 : "50%",
                                                        rotate: isFanOpen ? 0 : -5,
                                                        zIndex: isFanOpen ? 1 : 10
                                                    }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    className="relative z-10 w-full max-w-sm"
                                                >
                                                    <PricingWrapper
                                                        contactHref="/payment"
                                                        linkState={{ plan: 'basic', period: pricingPeriod, price: `${formattedBasicPrice}${periodLabel}` }}
                                                        type="waves"
                                                        className="bg-[#00A947]"
                                                        rotation={rotation}
                                                        backChildren={
                                                            <>
                                                                <Heading>Básico</Heading>
                                                                <Price>
                                                                    {formattedBasicPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                                </Price>
                                                                <div className="w-full text-left pl-4">
                                                                    <ul className="text-lg">
                                                                        <li>Bot de WhatsApp</li>
                                                                    </ul>
                                                                </div>
                                                            </>
                                                        }
                                                    >
                                                        {< >
                                                            <Heading>Básico</Heading>
                                                            <Price>
                                                                {formattedBasicPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                            </Price>
                                                            <div className="w-full text-left pl-4">
                                                                <ul className="text-lg">
                                                                    <li>Bot de WhatsApp</li>
                                                                </ul>
                                                            </div>
                                                        </>}
                                                    </PricingWrapper>
                                                </motion.div>

                                                <motion.div
                                                    animate={{
                                                        x: isFanOpen ? 0 : "-50%",
                                                        rotate: isFanOpen ? 0 : 5,
                                                        zIndex: isFanOpen ? 1 : 20
                                                    }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    className="relative z-10 w-full max-w-sm"
                                                >
                                                    <PricingWrapper
                                                        contactHref="/payment"
                                                        linkState={{ plan: 'pro', period: pricingPeriod, price: `${formattedProPrice}${periodLabel}` }}
                                                        type="waves"
                                                        className="bg-[#00A947]"
                                                        featured={true}
                                                        rotation={rotation}
                                                        backChildren={
                                                            <>
                                                                <Heading>Pro</Heading>
                                                                <Price>
                                                                    {formattedProPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                                </Price>
                                                                <div className="w-full text-left pl-4">
                                                                    <ul className="text-lg">
                                                                        <li>Bot de WhatsApp</li>
                                                                        <li>Google Calendar</li>
                                                                        <li>TTS (Áudio)</li>
                                                                    </ul>
                                                                </div>
                                                            </>
                                                        }
                                                    >
                                                        {< >
                                                            <Heading>Pro</Heading>
                                                            <Price>
                                                                {formattedProPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                            </Price>
                                                            <div className="w-full text-left pl-4">
                                                                <ul className="text-lg">
                                                                    <li>Bot de WhatsApp</li>
                                                                    <li>Google Calendar</li>
                                                                    <li>TTS (Áudio)</li>
                                                                </ul>
                                                            </div>
                                                        </>}
                                                    </PricingWrapper>
                                                </motion.div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        {/* Footer */}
                        <Footer />
                    </>
                )
            }
        </div >
    );
};

export default Landing;

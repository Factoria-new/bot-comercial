import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play, ThumbsUp, ShoppingBag } from "lucide-react";
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
    const [isFrontAnnual, setIsFrontAnnual] = useState(false);
    const [isFanOpen, setIsFanOpen] = useState(true);

    const handleToggle = () => {
        if (!isFanOpen) return; // Prevent double clicks

        // 1. Fan In
        setIsFanOpen(false);

        // 2. Start Spin (Wait for Fan In)
        setTimeout(() => {
            setRotation(prev => prev + 360);
        }, 400);

        // 3. Swap Content (At 270deg - 75% of 600ms spin = 450ms)
        // Total delay = 400 + 450 = 850
        setTimeout(() => {
            setIsFrontAnnual(prev => !prev);
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
                        Inteligência que conversa,{' '}
                        <span className="text-[#00A947] block mt-2">Vendas que fecham</span>
                    </h1>

                    <p className="text-gray-600 text-left mt-8 text-[clamp(1.25rem,2vw,1.5rem)] w-full max-w-2xl mr-auto leading-relaxed">
                        Recupere 100% dos leads perdidos por demora na resposta. Atendimento instantâneo, inteligente e humano. A qualquer hora.
                    </p>

                    {/* Botões CTA */}
                    <div className="flex flex-wrap gap-4 mt-8 pointer-events-auto">
                        <Button
                            onClick={handleSkipToPricing}
                            className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        >
                            Ver Futuro
                        </Button>
                        <Button variant="outline" className="border-2 border-[#1E293B] text-[#1E293B] hover:bg-[#1E293B] hover:text-white font-semibold px-8 py-6 text-lg rounded-full transition-all">
                            Ver Demonstração
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
                                            <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-clash font-bold text-[#1E293B] text-center tracking-[-0.04em] leading-[0.85] group-hover:scale-105 transition-transform duration-500">
                                                REAL TIME DATA
                                            </h1>
                                        </div>

                                        <div className="group flex justify-center w-full">
                                            <p className="text-[clamp(0.75rem,2vw,1rem)] font-clash font-bold text-[#1E293B]/70 text-center tracking-[0.2em] uppercase group-hover:translate-y-1 transition-transform duration-300">
                                                +300% SALES BOOST
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Animated Arrow Cards */}
                                    <div className="flex flex-col gap-6 mt-[15vh] w-full max-w-[350px] md:max-w-[420px] self-start ml-4 md:ml-20">
                                        {[
                                            { icon: Play, color: "bg-[#027831]", value: "+100", label: "data points", width: "100%" },
                                            { icon: ThumbsUp, color: "bg-[#6366F1]", value: "+80", label: "data points", width: "85%" },
                                            { icon: ShoppingBag, color: "bg-[#EAB308]", value: "+50", label: "data points", width: "70%" }
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
                                        Muito além de um simples <br className="hidden md:block" />
                                        <span className="text-[#00A947]">Chatbot</span>
                                    </h2>
                                    <p className="text-xl text-slate-600 leading-relaxed">
                                        Esqueça as respostas prontas. Nossa IA entende contexto, intenção e emoção para vender como seus melhores especialistas.
                                    </p>
                                </div>
                            </div>

                            <div className="container mx-auto space-y-32 relative" style={{ maxWidth: "100%" }}>


                                {/* Feature 1 */}
                                <div className="relative">
                                    {/* Timeline Line Part (Start) */}
                                    <div className="hidden lg:block absolute left-1/2 w-1 bg-[#00A947] -translate-x-1/2 rounded-full" style={{ top: "50%", bottom: "-4rem" }} />
                                    {/* Timeline Dot */}
                                    <div className="hidden lg:block absolute left-1/2 top-1/2 w-8 h-8 bg-[#00A947] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />

                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-20%" }}
                                        transition={{ duration: 0.9 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                                    >
                                        <div className="order-2 lg:order-1 pl-20" style={{ maxWidth: "80%" }}>
                                            <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900" style={{ color: "#00A947" }}>
                                                Multiplicação de Força
                                            </h3>
                                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                                Você não precisa de mais atendentes. Você precisa de super-atendentes. Clone sua capacidade de atendimento instantaneamente.
                                            </p>
                                            <ul className="space-y-4 mb-8">
                                                {["Múltiplas conexões simultâneas", "Atendimento centralizado", "Escala sem aumentar a folha"].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                        <div className="w-2 h-2 rounded-full bg-[#00A947]"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="order-1 lg:order-2 flex justify-end relative pr-20">
                                            <div className="w-full max-w-md aspect-square bg-feature-green flex items-center justify-center shadow-inner overflow-hidden" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}>
                                                <img
                                                    src={bgFeature1}
                                                    alt="Multiplicação de Força"
                                                    className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Feature 2 */}
                                <div className="relative">
                                    {/* Timeline Line Part (Middle) */}
                                    <div className="hidden lg:block absolute left-1/2 w-1 bg-[#00A947] -translate-x-1/2 rounded-full" style={{ top: "-4rem", bottom: "-4rem" }} />
                                    {/* Timeline Dot */}
                                    <div className="hidden lg:block absolute left-1/2 top-1/2 w-8 h-8 bg-[#00A947] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />

                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-20%" }}
                                        transition={{ duration: 0.9 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                                    >
                                        <div className="order-1 flex justify-start relative pl-20">
                                            <div className="w-full max-w-md aspect-square bg-tan flex items-center justify-center shadow-inner overflow-hidden" style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}>
                                                <img
                                                    src={bgFeature1}
                                                    alt="Funcionários Digitais"
                                                    className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="order-2 ml-auto pr-20" style={{ maxWidth: "80%" }}>
                                            <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900" style={{ color: "#00A947" }}>
                                                Funcionários Digitais (IA)
                                            </h3>
                                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                                Cada conexão é equipada com um Cérebro de IA Independente. Eles nunca dormem, nunca têm um dia ruim.
                                            </p>
                                            <ul className="space-y-4 mb-8">
                                                {["Engenharia de Prompt Personalizada", "Humanização Extrema (Voz/TTS)", "Atendimento 24/7"].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                        <div className="w-2 h-2 rounded-full bg-[#00A947]"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Feature 3 */}
                                <div className="relative">
                                    {/* Timeline Line Part (Middle) */}
                                    <div className="hidden lg:block absolute left-1/2 w-1 bg-[#00A947] -translate-x-1/2 rounded-full" style={{ top: "-4rem", bottom: "-4rem" }} />
                                    {/* Timeline Dot */}
                                    <div className="hidden lg:block absolute left-1/2 top-1/2 w-8 h-8 bg-[#00A947] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />

                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-20%" }}
                                        transition={{ duration: 0.9 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                                    >
                                        <div className="order-2 lg:order-1 pl-20" style={{ maxWidth: "80%" }}>
                                            <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900" style={{ color: "#00A947" }} >
                                                Controle Total (Tempo Real)
                                            </h3>
                                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                                Gestão não é achismo, é dado. Acompanhe sua operação com tecnologia WebSocket em tempo real.
                                            </p>
                                            <ul className="space-y-4 mb-8">
                                                {["Sem 'F5' - Atualização instantânea", "Auto-Reconexão Inteligente", "Métricas de verdade"].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                        <div className="w-2 h-2 rounded-full bg-[#00A947]"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="order-1 lg:order-2 flex justify-end relative pr-20">
                                            <div className="w-full max-w-md aspect-square bg-feature-green flex items-center justify-center shadow-inner overflow-hidden" style={{ borderRadius: "50% 50% 20% 80% / 25% 80% 20% 75%" }}>
                                                <img
                                                    src={bgFeature1}
                                                    alt="Controle Total"
                                                    className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Feature 4 */}
                                <div className="relative">
                                    {/* Timeline Line Part (End) */}
                                    <div className="hidden lg:block absolute left-1/2 w-1 bg-[#00A947] -translate-x-1/2 rounded-full" style={{ top: "-4rem", bottom: "50%" }} />
                                    {/* Timeline Dot */}
                                    <div className="hidden lg:block absolute left-1/2 top-1/2 w-8 h-8 bg-[#00A947] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" />

                                    <motion.div
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-20%" }}
                                        transition={{ duration: 0.9 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                                    >
                                        <div className="order-1 flex justify-start relative pl-20">
                                            <div className="w-full max-w-md aspect-square bg-brown flex items-center justify-center shadow-inner overflow-hidden" style={{ borderRadius: "70% 30% 30% 70% / 60% 40% 60% 40%" }}>
                                                <img
                                                    src={bgFeature1}
                                                    alt="Confiabilidade Enterprise"
                                                    className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="order-2 ml-auto pr-20" style={{ maxWidth: "80%" }}>
                                            <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900" style={{ color: "#00A947" }}>
                                                Confiabilidade Enterprise
                                            </h3>
                                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                                Sua operação não pode parar. Arquitetura robusta projetada para estabilidade máxima.
                                            </p>
                                            <ul className="space-y-4 mb-8">
                                                {["Persistência de Sessão", "Zero Configuração Repetitiva", "Segurança de dados"].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                        <div className="w-2 h-2 rounded-full bg-[#00A947]"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </section>





                        {/* Testimonials Section */}
                        <TestimonialsSection />

                        {/* Pricing Section */}
                        <section id="pricing" className="relative min-h-screen flex flex-col justify-center py-24 px-6 md:px-12 bg-slate-900 overflow-hidden">
                            {/* Background Video */}
                            <div className="absolute inset-0 z-0">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: "50% 100%" }}
                                >
                                    <source src="/videos-scroll/NAVIGATE_4K_S20_loop@md.mp4" type="video/mp4" />
                                </video>
                            </div>

                            <div className="container mx-auto relative z-10" style={{ maxWidth: "100%" }}>
                                <div className="text-center mb-8">
                                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                        Planos Flexíveis
                                    </h2>
                                    <p className="text-xl text-white max-w-2xl mx-auto font-medium">
                                        Comece pequeno e escale conforme sua demanda cresce. Sem contratos de longo prazo.
                                    </p>
                                </div>

                                <div className="flex justify-center mb-12">
                                    <div className="bg-slate-800 p-1 rounded-full flex relative items-center cursor-pointer" onClick={handleToggle}>
                                        <div
                                            className={`absolute top-1 bottom-1 w-[50%] bg-[#00A947] rounded-full transition-all duration-300 ${isFrontAnnual ? 'left-[49%]' : 'left-1'}`}
                                        />
                                        <div className={`relative z-10 px-8 py-2 rounded-full transition-colors duration-300 ${!isFrontAnnual ? 'text-white font-bold' : 'text-slate-400'}`}>
                                            Mensal
                                        </div>
                                        <div className={`relative z-10 px-8 py-2 rounded-full transition-colors duration-300 ${isFrontAnnual ? 'text-white font-bold' : 'text-slate-400'}`}>
                                            Anual
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-8 md:flex-row flex-wrap relative h-[600px] w-full">
                                    {/* Used explicit height for the container since cards are absolute positioned during animation? 
                                       Actually, let's keep them in flow but use transforms. 
                                       If we use transforms, they might overlap visually. 
                                       Gap is 8 (2rem). MD: flex-row.
                                     */}

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
                                            contactHref="/login"
                                            type="waves"
                                            className="bg-[#FE601E]"
                                            rotation={rotation}
                                            backChildren={
                                                !isFrontAnnual ? (
                                                    // Back shows Annual (if front is Monthly)
                                                    <>
                                                        <Heading>Básico</Heading>
                                                        <Price>
                                                            R$ 970<br /><span className="text-2xl">/ano</span>
                                                        </Price>
                                                        <div className="w-full text-left pl-4">
                                                            <ul className="list-disc list-inside text-lg">
                                                                <li>Bot de WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Back shows Monthly (if front is Annual)
                                                    <>
                                                        <Heading>Básico</Heading>
                                                        <Price>
                                                            R$ 97<br /><span className="text-2xl">/mês</span>
                                                        </Price>
                                                        <div className="w-full text-left pl-4">
                                                            <ul className="list-disc list-inside text-lg">
                                                                <li>Bot de WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                )
                                            }
                                        >
                                            {isFrontAnnual ? (
                                                // Front shows Annual
                                                <>
                                                    <Heading>Básico</Heading>
                                                    <Price>
                                                        R$ 970<br /><span className="text-2xl">/ano</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="list-disc list-inside text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            ) : (
                                                // Front shows Monthly
                                                <>
                                                    <Heading>Básico</Heading>
                                                    <Price>
                                                        R$ 97<br /><span className="text-2xl">/mês</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="list-disc list-inside text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            )}
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
                                            contactHref="/contact"
                                            type="waves"
                                            className="bg-[#00A947]"
                                            featured={true}
                                            rotation={rotation}
                                            backChildren={
                                                !isFrontAnnual ? (
                                                    <>
                                                        <Heading>Pro</Heading>
                                                        <Price>
                                                            R$ 1.970<br /><span className="text-2xl">/ano</span>
                                                        </Price>
                                                        <div className="w-full text-left pl-4">
                                                            <ul className="list-disc list-inside text-lg">
                                                                <li>Bot de WhatsApp</li>
                                                                <li>Google Calendar</li>
                                                                <li>TTS (Áudio)</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Heading>Pro</Heading>
                                                        <Price>
                                                            R$ 197<br /><span className="text-2xl">/mês</span>
                                                        </Price>
                                                        <div className="w-full text-left pl-4">
                                                            <ul className="list-disc list-inside text-lg">
                                                                <li>Bot de WhatsApp</li>
                                                                <li>Google Calendar</li>
                                                                <li>TTS (Áudio)</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                )
                                            }
                                        >
                                            {isFrontAnnual ? (
                                                <>
                                                    <Heading>Pro</Heading>
                                                    <Price>
                                                        R$ 1.970<br /><span className="text-2xl">/ano</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="list-disc list-inside text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                            <li>Google Calendar</li>
                                                            <li>TTS (Áudio)</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Heading>Pro</Heading>
                                                    <Price>
                                                        R$ 197<br /><span className="text-2xl">/mês</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="list-disc list-inside text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                            <li>Google Calendar</li>
                                                            <li>TTS (Áudio)</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            )}
                                        </PricingWrapper>
                                    </motion.div>
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

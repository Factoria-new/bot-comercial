import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PricingWrapper, Heading, Price, Paragraph } from "@/components/ui/animated-pricing-cards";
import { TestimonialsSection } from "@/components/testimonials-section";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";
import { ChatOverlay } from "@/components/chat-overlay";


gsap.registerPlugin(ScrollTrigger);

const bgFeature1 = "/images/ImagemGemini5.png";

const bgFeature4 = "/images/ImagemGemini4.png";


const Landing = () => {
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

    useEffect(() => {
        // Force scroll to top on mount
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link) };
    }, []);

    useEffect(() => {
        const wrapper = videoWrapperRef.current;
        if (wrapper) {
            gsap.set(wrapper, {
                width: "40vw",
                height: "70vh",
                top: "15vh",
                right: "5vw",
                borderRadius: "30px"
            });
        }
    }, []);

    const playReverse = useCallback(() => {
        const videoReverse = videoReverseRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!videoReverse || !videoEndLoop) return;

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
                gsap.set(videoLoopRef.current, { autoAlpha: 1 });
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

                        const tl = gsap.timeline({
                            onComplete: () => {
                                isAnimatingRef.current = false;
                                setPhase('initial');
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
    const handleResetToHome = (e: React.MouseEvent) => {
        e.preventDefault();

        const wrapper = videoWrapperRef.current;
        const heroText = heroTextRef.current;
        const videoLoop = videoLoopRef.current;
        const videoMain = videoMainRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!wrapper || !heroText || !videoLoop || !videoMain || !videoEndLoop) return;

        // 1. Parar animações
        isAnimatingRef.current = false;
        if (reverseAnimationRef.current) {
            cancelAnimationFrame(reverseAnimationRef.current);
        }

        // 2. Resetar vídeos
        videoMain.pause();
        videoMain.currentTime = 0;
        gsap.set(videoMain, { autoAlpha: 0 });

        videoEndLoop.pause();
        videoEndLoop.currentTime = 0;
        gsap.set(videoEndLoop, { autoAlpha: 0 });

        videoLoop.play();
        gsap.set(videoLoop, { autoAlpha: 1 });

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

        // 4. Resetar estados
        setPhase('initial');
        zoomLevelRef.current = 1;
        zoomEndLevelRef.current = 1;

        // 5. Scroll para o topo
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
                    <a href="#sobre" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                        Sobre Nós
                    </a>
                    <a href="#produto" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                        Produto
                    </a>
                </nav>

                <Link to="/login">
                    <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                        Entrar
                    </Button>
                </Link>
            </header>

            {/* Container Principal */}
            <div className="relative bg-white min-h-screen">
                {/* Texto Hero (Lado Esquerdo) */}
                <div
                    ref={heroTextRef}
                    className="absolute top-0 left-0 w-[50vw] h-screen flex flex-col justify-center pb-24 pl-8 md:pl-16 z-10"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-[#00A947]/10 text-[#00A947] px-4 py-2 rounded-full text-sm font-medium mb-6 w-fit">
                        <span className="w-2 h-2 bg-[#00A947] rounded-full animate-pulse"></span>
                        Tecnologia State-of-the-Art
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1E293B] leading-tight drop-shadow-lg text-left">
                        Inteligência <br />
                        que conversa, <br />
                        <span className="text-[#00A947]">Vendas que <br />fecham</span>
                    </h1>

                    <p className="text-gray-600 text-left mt-6 text-xl max-w-lg mr-auto">
                        Recupere 100% dos leads perdidos por demora na resposta. Atendimento instantâneo, inteligente e humano. A qualquer hora.
                    </p>

                    {/* Botões CTA */}
                    <div className="flex flex-wrap gap-4 mt-8">
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
                </div>

                {/* Wrapper do Vídeo */}
                <div
                    ref={videoWrapperRef}
                    className="absolute bg-black overflow-hidden shadow-2xl z-20"
                    style={{ willChange: 'width, height, top, right, border-radius' }}
                >
                    {/* Vídeo Loop Inicial */}
                    <video
                        ref={videoLoopRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 1 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40_loop@md.mp4" type="video/mp4" />
                    </video>

                    {/* Vídeo Principal (toca após expansão) */}
                    <video
                        ref={videoMainRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md.mp4" type="video/mp4" />
                    </video>

                    {/* Vídeo Reverso (otimizado para seek) */}
                    <video
                        ref={videoReverseRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4" type="video/mp4" />
                    </video>

                    {/* Vídeo Loop Final */}
                    <video
                        ref={videoEndLoopRef}
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ opacity: 0 }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S50_loop@md.mp4" type="video/mp4" />
                    </video>

                    {/* Chat Overlay - Only visible in expanded phase (100% screen) */}
                    {phase === 'expanded' && <ChatOverlay />}

                    {/* Overlay de Métricas */}
                    <div
                        className={`absolute top-1/2 left-8 md:left-20 -translate-y-1/2 z-30 max-w-md transition-opacity duration-500 ${phase === 'ended' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        <div className="space-y-6">
                            <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10">
                                <h3 className="text-3xl font-bold text-white mb-2">Métricas em Tempo Real</h3>
                                <p className="text-lg text-gray-200">Visão completa da sua operação.</p>
                            </div>
                            <div className="bg-black/60 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10">
                                <h3 className="text-3xl font-bold text-white mb-2">+300% em Vendas</h3>
                                <p className="text-lg text-gray-200">Resultados comprovados.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Section - Sobre Nós */}
            <AboutSection />



            {/* Resto do Site */}
            {phase === 'ended' && (
                <>

                    <section id="produto" className="relative py-24 px-6 md:px-12 bg-[#FFFFFF] text-slate-900 overflow-hidden">
                        <div className="container mx-auto space-y-32" style={{ maxWidth: '100%' }}>
                            {/* Feature 1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2  gap-20 items-center" style={{ gap: 'auto', marginLeft: '5rem' }}>
                                <div className="order-2 lg:order-1">
                                    <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
                                        Multiplicação de Força
                                    </h3>
                                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                        Você não precisa de mais atendentes. Você precisa de super-atendentes. Clone sua capacidade de atendimento instantaneamente.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {["Múltiplas instâncias simultâneas", "Atendimento centralizado", "Escala sem aumentar a folha"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-feature-green"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="order-1 lg:order-2 flex justify-center relative" style={{ gap: 'auto' }}>
                                    <div className="w-full max-w-md aspect-square bg-feature-green flex items-center justify-center shadow-inner" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" style={{ gap: 'auto' }}>
                                <div className="order-1 flex justify-center relative">
                                    <div className="w-full max-w-md aspect-square bg-tan flex items-center justify-center shadow-inner" style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <path d="M12 8V4H8" />
                                            <rect width="16" height="12" x="4" y="8" rx="2" />
                                            <path d="M2 14h2" />
                                            <path d="M20 14h2" />
                                            <path d="M15 13v2" />
                                            <path d="M9 13v2" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="order-2">
                                    <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
                                        Funcionários Digitais (IA)
                                    </h3>
                                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                        Cada instância é equipada com um Cérebro de IA Independente. Eles nunca dormem, nunca têm um dia ruim.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {["Engenharia de Prompt Personalizada", "Humanização Extrema (Voz/TTS)", "Atendimento 24/7"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-tan"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" style={{ gap: 'auto', marginLeft: '5rem' }}>
                                <div className="order-2 lg:order-1">
                                    <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
                                        Controle Total (Tempo Real)
                                    </h3>
                                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                        Gestão não é achismo, é dado. Acompanhe sua operação com tecnologia WebSocket em tempo real.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {["Sem 'F5' - Atualização instantânea", "Auto-Reconexão Inteligente", "Métricas de verdade"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-feature-green"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="order-1 lg:order-2 flex justify-center relative">
                                    <div className="w-full max-w-md aspect-square bg-feature-green flex items-center justify-center shadow-inner" style={{ borderRadius: "50% 50% 20% 80% / 25% 80% 20% 75%" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                            <line x1="3" x2="21" y1="9" y2="9" />
                                            <line x1="9" x2="9" y1="21" y2="9" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 4 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                                <div className="order-1 flex justify-center relative">
                                    <div className="w-full max-w-md aspect-square bg-brown flex items-center justify-center shadow-inner" style={{ borderRadius: "70% 30% 30% 70% / 60% 40% 60% 40%" }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="order-2">
                                    <h3 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-slate-900">
                                        Confiabilidade Enterprise
                                    </h3>
                                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                        Sua operação não pode parar. Arquitetura robusta projetada para estabilidade máxima.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        {["Persistência de Sessão", "Zero Configuração Repetitiva", "Segurança de dados"].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-brown"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>





                    {/* Testimonials Section */}
                    <TestimonialsSection />

                    {/* Pricing Section */}
                    <section id="pricing" className="relative py-24 px-6 md:px-12 bg-slate-100 overflow-hidden">
                        {/* Background Video */}
                        <div className="absolute inset-0 z-0">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
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

                            <div className="flex flex-col items-center justify-center gap-8 md:flex-row flex-wrap">
                                <PricingWrapper contactHref="/login" type="waves" className="bg-[#00A947]">
                                    <Heading>Mensal</Heading>
                                    <Price>
                                        R$ 19,90<br /><span className="text-2xl">/mês</span>
                                    </Price>
                                    <Paragraph className="text-lg">
                                        Acesso Completo<br />Sem fidelidade
                                    </Paragraph>
                                </PricingWrapper>

                                <PricingWrapper contactHref="/login" type="crosses" className="bg-[#243B6B]">
                                    <Heading>Anual</Heading>
                                    <Price>
                                        R$ 197<br /><span className="text-2xl">/ano</span>
                                    </Price>
                                    <Paragraph className="text-lg">
                                        Economize 17%<br />Equivalente a R$16/mês
                                    </Paragraph>
                                </PricingWrapper>

                                <PricingWrapper contactHref="/contact" type="waves" className="bg-slate-900" featured={true}>
                                    <Heading>Vitalício</Heading>
                                    <Price>
                                        R$ 297<br /><span className="text-2xl">único</span>
                                    </Price>
                                    <Paragraph className="text-lg">
                                        Pague uma vez<br />Acesso para sempre<br />Oferta Limitada
                                    </Paragraph>
                                </PricingWrapper>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    {/* Footer */}
                    <Footer />
                </>
            )}
        </div>
    );
};

export default Landing;

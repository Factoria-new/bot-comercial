import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";

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

    useEffect(() => {
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
        return () => videoMain.removeEventListener('ended', handleEnded);
    }, []);

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header - Só o container maior fica transparente */}
            <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl py-3 px-6 flex justify-between items-center rounded-2xl transition-all duration-500 ${phase === 'initial'
                ? 'bg-white/80 backdrop-blur-md shadow-lg border border-gray-100'
                : 'bg-transparent shadow-none border-transparent'
                }`}>
                <img src="/logo-header.png" alt="Factoria" className="h-8 md:h-10 w-auto object-contain" />

                {/* Navegação Central - mantém o fundo pill sempre */}
                <nav className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                    <a href="#home" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
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
                        Mais de 500 empresas já automatizaram
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1E293B] leading-tight drop-shadow-lg text-left">
                        Automatize <br />
                        seu <span className="text-[#00A947]">WhatsApp</span> <br />
                        com IA
                    </h1>

                    <p className="text-gray-600 text-left mt-6 text-xl max-w-lg mr-auto">
                        Transforme seu atendimento com a tecnologia que escala seu negócio enquanto você dorme.
                    </p>

                    {/* Botões CTA */}
                    <div className="flex flex-wrap gap-4 mt-8">
                        <Link to="/login">
                            <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                Começar Agora
                            </Button>
                        </Link>
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

            {/* Resto do Site */}
            {phase === 'ended' && (
                <section className="relative z-20 bg-[#F8FAFC] pt-32 pb-24 px-4 md:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-[#1E293B]">O que torna o Factoria único</h2>
                        <p className="text-xl text-[#475569] mt-4">Tecnologia de ponta para o seu negócio.</p>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Landing;

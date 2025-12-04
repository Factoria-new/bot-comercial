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
    const zoomLevelRef = useRef(1); // Zoom inicial = 1 (100%)
    const zoomEndLevelRef = useRef(1); // Zoom do loop final
    const maxZoom = 1.05; // Zoom máximo = 5% (quase imperceptível)
    const zoomStep = 0.015; // Incremento por scroll

    useEffect(() => {
        // Fonte Poppins
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link) };
    }, []);

    // Configuração inicial do wrapper
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

    // Função para tocar vídeo em reverso
    const playReverse = useCallback(() => {
        const videoReverse = videoReverseRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!videoReverse || !videoEndLoop) return;

        // Para o loop final e mostra o vídeo otimizado para reverso
        videoEndLoop.pause();
        gsap.set(videoEndLoop, { autoAlpha: 0 });

        // Posiciona o vídeo de reverso no final
        videoReverse.currentTime = videoReverse.duration;
        gsap.set(videoReverse, { autoAlpha: 1 });

        setPhase('reversing');

        // Animação de reverso usando requestAnimationFrame
        const reverseSpeed = 1; // Velocidade do reverso (1x = velocidade normal)
        let lastTime = performance.now();

        const animateReverse = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000; // em segundos
            lastTime = currentTime;

            if (videoReverse.currentTime > 0) {
                videoReverse.currentTime = Math.max(0, videoReverse.currentTime - (deltaTime * reverseSpeed));
                reverseAnimationRef.current = requestAnimationFrame(animateReverse);
            } else {
                // Vídeo chegou ao início - volta para o loop inicial
                gsap.set(videoReverse, { autoAlpha: 0 });
                gsap.set(videoLoopRef.current, { autoAlpha: 1 });
                setPhase('expanded');
                reverseAnimationRef.current = null;
            }
        };

        reverseAnimationRef.current = requestAnimationFrame(animateReverse);
    }, []);

    // Cleanup do reverso
    useEffect(() => {
        return () => {
            if (reverseAnimationRef.current) {
                cancelAnimationFrame(reverseAnimationRef.current);
            }
        };
    }, []);

    // Handler de interação (scroll/touch)
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

            // Detectar direção do scroll
            const wheelEvent = e as WheelEvent;
            const isScrollUp = wheelEvent.deltaY < 0;

            // FASE 1: Initial -> Expanded (somente scroll down)
            if (phase === 'initial') {
                if (isScrollUp) {
                    e.preventDefault();
                    return; // Ignora scroll up
                }

                e.preventDefault();
                isAnimatingRef.current = true;

                const tl = gsap.timeline({
                    onComplete: () => {
                        isAnimatingRef.current = false;
                        setPhase('expanded');
                    }
                });

                // Expansão do wrapper
                tl.to(wrapper, {
                    width: "100vw",
                    height: "100vh",
                    top: "0vh",
                    right: "0vw",
                    borderRadius: "0px",
                    duration: 1.5,
                    ease: "power2.inOut"
                }, 0);

                // Fade out do texto
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

                const videoLoop = videoLoopRef.current;

                if (isScrollUp) {
                    // Scroll UP: diminui zoom ou volta a expansão
                    if (zoomLevelRef.current > 1) {
                        // Diminui o zoom
                        zoomLevelRef.current = Math.max(1, zoomLevelRef.current - zoomStep);
                        gsap.to(videoLoop, {
                            scale: zoomLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        // Já está no zoom mínimo, volta a expansão (contrai o vídeo)
                        isAnimatingRef.current = true;

                        const tl = gsap.timeline({
                            onComplete: () => {
                                isAnimatingRef.current = false;
                                setPhase('initial');
                            }
                        });

                        // Contrai o wrapper
                        tl.to(wrapper, {
                            width: "40vw",
                            height: "70vh",
                            top: "15vh",
                            right: "5vw",
                            borderRadius: "30px",
                            duration: 1.5,
                            ease: "power2.inOut"
                        }, 0);

                        // Fade in do texto
                        tl.to(heroText, {
                            x: 0,
                            autoAlpha: 1,
                            duration: 1.0
                        }, 0);
                    }
                } else {
                    // Scroll DOWN: aumenta zoom ou inicia vídeo
                    if (zoomLevelRef.current < maxZoom) {
                        // Aumenta o zoom gradualmente
                        zoomLevelRef.current = Math.min(maxZoom, zoomLevelRef.current + zoomStep);
                        gsap.to(videoLoop, {
                            scale: zoomLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        // Zoom máximo atingido, inicia o vídeo principal
                        isAnimatingRef.current = true;

                        gsap.set(videoLoop, { autoAlpha: 0 });
                        gsap.set(videoMain, { autoAlpha: 1 });
                        videoMain.currentTime = 0;
                        videoMain.play();

                        // Reseta o zoom para próxima vez
                        zoomLevelRef.current = 1;
                        gsap.set(videoLoop, { scale: 1 });

                        isAnimatingRef.current = false;
                        setPhase('playing');
                    }
                }

                return;
            }

            // FASE 3: Playing - bloqueia scroll enquanto vídeo toca
            if (phase === 'playing') {
                e.preventDefault();
                return;
            }

            // FASE 4: Ended - zoom e scroll
            if (phase === 'ended') {
                const videoEndLoop = videoEndLoopRef.current;

                if (isScrollUp) {
                    e.preventDefault();
                    // Scroll UP: diminui zoom ou reverte o vídeo
                    if (zoomEndLevelRef.current > 1) {
                        // Diminui o zoom
                        zoomEndLevelRef.current = Math.max(1, zoomEndLevelRef.current - zoomStep);
                        gsap.to(videoEndLoop, {
                            scale: zoomEndLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    } else {
                        // Já está no zoom mínimo, reverte o vídeo
                        zoomEndLevelRef.current = 1;
                        gsap.set(videoEndLoop, { scale: 1 });
                        playReverse();
                    }
                } else {
                    // Scroll DOWN: aumenta zoom ou libera scroll
                    if (zoomEndLevelRef.current < maxZoom) {
                        e.preventDefault();
                        zoomEndLevelRef.current = Math.min(maxZoom, zoomEndLevelRef.current + zoomStep);
                        gsap.to(videoEndLoop, {
                            scale: zoomEndLevelRef.current,
                            duration: 0.3,
                            ease: "power1.out"
                        });
                    }
                    // Após zoom máximo, NÃO bloqueia - scroll normal na página
                }
                return;
            }

            // FASE 5: Reversing - bloqueia scroll enquanto reverte
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

    // Listener para quando o vídeo principal termina
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
            {/* Header */}
            <header className="fixed top-0 left-0 z-50 w-full py-6 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
                <img src="/logo-header.png" alt="Factoria" className="h-10 md:h-14 w-auto object-contain drop-shadow-lg" />

                {/* Navegação */}
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#home" className="text-white hover:text-[#00A947] transition-colors font-medium">Home</a>
                    <a href="#sobre" className="text-white hover:text-[#00A947] transition-colors font-medium">Sobre Nós</a>
                    <a href="#produto" className="text-white hover:text-[#00A947] transition-colors font-medium">Produto</a>
                </nav>

                <Link to="/login">
                    <Button className="bg-[#1F345E] text-white hover:bg-[#1F345E]/90 font-semibold px-6 md:px-8 py-2 md:py-3 rounded-full shadow-lg">
                        Entrar
                    </Button>
                </Link>
            </header>

            {/* Container Principal */}
            <div className="relative bg-[#5B53D9] min-h-screen">
                {/* Texto Hero (Lado Esquerdo) */}
                <div
                    ref={heroTextRef}
                    className="absolute top-0 left-0 w-[50vw] h-screen flex flex-col justify-start pt-32 md:pt-40 pl-8 md:pl-16 z-10"
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg text-left">
                        Automatize <br />
                        seu <span className="text-[#00A947]" style={{ WebkitTextStroke: '1px white' }}>WhatsApp</span> <br />
                        com IA
                    </h1>
                    <p className="text-gray-300 text-left mt-6 text-xl max-w-lg mr-auto">
                        Transforme seu atendimento com a tecnologia que escala seu negócio enquanto você dorme.
                    </p>
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

                    {/* Overlay de Métricas (aparece quando vídeo termina) */}
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

            {/* Resto do Site (só aparece após o vídeo terminar) */}
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

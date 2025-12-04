import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoWrapperRef = useRef<HTMLDivElement>(null);
    const videoLoopRef = useRef<HTMLVideoElement>(null);
    const videoScrollRef = useRef<HTMLVideoElement>(null);
    const videoEndLoopRef = useRef<HTMLVideoElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);

    const [isEnded, setIsEnded] = useState(false);

    useEffect(() => {
        // Fonte Poppins
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { document.head.removeChild(link) };
    }, []);

    useEffect(() => {
        const videoScroll = videoScrollRef.current;
        const videoLoop = videoLoopRef.current;
        const videoEndLoop = videoEndLoopRef.current;
        const wrapper = videoWrapperRef.current;
        const container = containerRef.current;
        const heroText = heroTextRef.current;

        if (!videoScroll || !container || !wrapper) return;

        let ctx = gsap.context(() => {
            const initAnimation = () => {
                const videoDuration = videoScroll.duration || 10;

                // Timeline Principal
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0, // Instantâneo para tirar a sensação de "peso/travamento"
                        snap: {
                            snapTo: [0, 0.2, 1], // Snap no início, 20% (Tela Cheia) e fim
                            duration: { min: 2.0, max: 5.0 }, // Snap bem mais lento para o vídeo não correr
                            delay: 0.1, // Pequeno delay para não brigar com o usuário
                            ease: "power2.inOut",
                            inertia: false
                        }
                    }
                });

                // --- FASE 1: Expansão do Vídeo (De Direita para Full Screen) ---
                // Ocupa os primeiros 20% do scroll (0 a 0.2)
                tl.fromTo(wrapper,
                    {
                        // ESTADO INICIAL (Canto Direito)
                        width: "40vw",           // Largura de tablet
                        height: "70vh",          // Altura de tablet
                        top: "15vh",             // Centralizado verticalmente
                        right: "5vw",            // Margem direita
                        // left: "auto" REMOVIDO
                        borderRadius: "30px",    // Bordas arredondadas
                    },
                    {
                        // ESTADO FINAL (Tela Cheia)
                        width: "100vw",
                        height: "100vh",
                        top: "0vh",
                        right: "0vw",
                        // left: "0vw" REMOVIDO para evitar conflito e garantir expansão da direita
                        borderRadius: "0px",
                        duration: 2,             // Duração relativa na timeline (mais lento)
                        ease: "power2.inOut"
                    },
                    0
                );

                // Fade out do Texto (Esquerda) enquanto o vídeo expande
                tl.to(heroText, {
                    x: -100, // Move para esquerda
                    autoAlpha: 0,
                    duration: 1.5
                }, 0);

                // Transição suave entre Loop inicial e Vídeo de Scroll
                // Acontece APÓS a expansão e um micro-delay (tempo 2.1) para manter o loop rodando no snap
                tl.to(videoLoop, { autoAlpha: 0, duration: 0 }, 2.1);
                tl.to(videoScroll, { autoAlpha: 1, duration: 0 }, 2.1);

                // --- FASE 2: Tocar o Vídeo com Scroll ---
                // Ocupa o resto da timeline
                const videoState = { currentTime: 0 };

                tl.to(videoState, {
                    currentTime: videoDuration,
                    duration: 8, // Muito mais tempo de scroll dedicado ao vídeo (80% da timeline)
                    ease: "none",
                    onUpdate: () => {
                        if (videoScroll) videoScroll.currentTime = videoState.currentTime;

                        // Lógica Overlay
                        const metricsOverlay = document.getElementById('metrics-overlay');
                        const progress = videoState.currentTime / videoDuration;

                        if (metricsOverlay) {
                            if (progress > 0.95) {
                                metricsOverlay.style.opacity = '1';
                                metricsOverlay.style.pointerEvents = 'auto';
                            } else {
                                metricsOverlay.style.opacity = '0';
                                metricsOverlay.style.pointerEvents = 'none';
                            }
                        }

                        // Lógica Loop Final
                        if (progress >= 0.99) {
                            if (!isEnded) {
                                setIsEnded(true);
                                if (videoEndLoop) videoEndLoop.play();
                            }
                        } else {
                            if (isEnded) {
                                setIsEnded(false);
                                if (videoEndLoop) videoEndLoop.pause();
                            }
                        }
                    }
                }, 2.1); // Começa após a expansão e o micro-delay (offset 2.1)
            };

            if (videoScroll.readyState >= 1) {
                initAnimation();
            } else {
                videoScroll.addEventListener('loadedmetadata', initAnimation);
            }
        });

        return () => ctx.revert();
    }, [isEnded]);

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>

            {/* 1. HEADER FIXO (Fora de tudo para não bugar na animação) */}
            <header className="fixed top-0 left-0 z-50 w-full py-6 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
                <img src="/logo-header.png" alt="Factoria" className="h-10 md:h-14 w-auto object-contain drop-shadow-lg" />
                <Link to="/login">
                    <Button className="bg-[#1F345E] text-white hover:bg-[#1F345E]/90 font-semibold px-6 md:px-8 py-2 md:py-3 rounded-full shadow-lg">
                        Entrar
                    </Button>
                </Link>
            </header>

            {/* Container de Scroll (Altura aumentada para 800vh para deixar animação mais lenta) */}
            <div ref={containerRef} className="relative bg-[#0F1C35]" style={{ height: '1200vh' }}>

                {/* Viewport Sticky */}
                <div className="sticky top-0 h-screen w-full overflow-hidden">

                    {/* 2. TEXTO HERO (Lado Esquerdo Inicialmente) */}
                    <div
                        ref={heroTextRef}
                        className="absolute top-0 left-0 w-[50vw] h-full flex flex-col justify-center pl-8 md:pl-16 z-10"
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-lg text-left">
                            Automatize <br />
                            seu <span className="text-[#078B48]" style={{ WebkitTextStroke: '1px white' }}>WhatsApp</span> <br />
                            com IA
                        </h1>
                        <p className="text-gray-300 text-left mt-6 text-xl max-w-lg mr-auto">
                            Transforme seu atendimento com a tecnologia que escala seu negócio enquanto você dorme.
                        </p>
                    </div>

                    {/* 3. WRAPPER DO VÍDEO (Lado Direito -> Expande para Tela Cheia) */}
                    <div
                        ref={videoWrapperRef}
                        className="absolute bg-black overflow-hidden shadow-2xl z-20"
                        style={{ willChange: 'width, height, top, left, right, border-radius' }}
                    >
                        {/* Vídeo Loop Inicial */}
                        <video
                            ref={videoLoopRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute top-0 left-0 w-full h-full object-cover opacity-100"
                        >
                            <source src="/videos-scroll/NAVIGATE_4K_S40_loop@sm.mp4" type="video/mp4" />
                        </video>

                        {/* Vídeo Scroll */}
                        <video
                            ref={videoScrollRef}
                            muted
                            playsInline
                            preload="auto"
                            className="absolute top-0 left-0 w-full h-full object-cover opacity-0"
                        >
                            <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4" type="video/mp4" />
                        </video>

                        {/* Vídeo Loop Final */}
                        <video
                            ref={videoEndLoopRef}
                            loop
                            muted
                            playsInline
                            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ${isEnded ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <source src="/videos-scroll/NAVIGATE_4K_S50_loop@sm.mp4" type="video/mp4" />
                        </video>

                        {/* Overlay de Métricas (Só aparece no final) */}
                        <div
                            id="metrics-overlay"
                            className="absolute top-1/2 left-8 md:left-20 -translate-y-1/2 z-30 max-w-md opacity-0 pointer-events-none transition-opacity duration-500"
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
            </div>

            {/* Resto do Site */}
            <section className="relative z-20 bg-[#F8FAFC] pt-32 pb-24 px-4 md:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-[#1E293B]">O que torna o Factoria único</h2>
                    <p className="text-xl text-[#475569] mt-4">Tecnologia de ponta para o seu negócio.</p>
                </div>
            </section>
        </div>
    );
};

export default Landing;
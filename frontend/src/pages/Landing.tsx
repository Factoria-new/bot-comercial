import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const videoLoopRef = useRef<HTMLVideoElement>(null);
    const videoScrollRef = useRef<HTMLVideoElement>(null);
    const videoEndLoopRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const heroTextRef = useRef<HTMLDivElement>(null);

    // Refs for smooth animation
    const targetTimeRef = useRef(0);
    const animationFrameRef = useRef<number>();

    // Removed isScrolling state for performance
    const [isEnded, setIsEnded] = useState(false);

    useEffect(() => {
        // Add Google Font - Poppins for elegant, modern typography
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => { };
    }, []);

    useEffect(() => {
        const videoScroll = videoScrollRef.current;
        const videoLoop = videoLoopRef.current;
        const videoEndLoop = videoEndLoopRef.current;

        if (!videoScroll || !containerRef.current) return;

        let scrollTriggerInstance: ScrollTrigger | null = null;

        // Wait for video metadata to load
        const handleLoadedMetadata = () => {
            const videoDuration = videoScroll.duration;
            console.log('Video loaded, duration:', videoDuration);

            // Animation loop for smooth scrubbing
            const updateVideo = () => {
                if (!videoScroll) return;

                // Interpolate current time towards target time
                // 0.1 factor gives a smooth delay (butter smooth effect)
                const diff = targetTimeRef.current - videoScroll.currentTime;

                if (Math.abs(diff) > 0.001) {
                    videoScroll.currentTime += diff * 0.1;
                }

                animationFrameRef.current = requestAnimationFrame(updateVideo);
            };

            // Start the animation loop
            updateVideo();

            // Create scroll-driven animation
            scrollTriggerInstance = ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: 0, // Instant scrub updates, smoothing handled by RAF
                onUpdate: (self) => {
                    // Update target time based on scroll progress
                    const newTime = videoDuration * self.progress;
                    if (Number.isFinite(newTime)) {
                        targetTimeRef.current = newTime;
                    }

                    // Metrics Overlay Logic
                    const metricsOverlay = document.getElementById('metrics-overlay');
                    if (metricsOverlay) {
                        // Show only at the end (last video loop)
                        if (self.progress > 0.95) {
                            metricsOverlay.style.opacity = '1';
                            metricsOverlay.style.pointerEvents = 'auto';
                        } else {
                            metricsOverlay.style.opacity = '0';
                            metricsOverlay.style.pointerEvents = 'none';
                        }
                    }

                    // Check if animation ended (near 100% progress)
                    if (self.progress >= 0.99) {
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
            });
        };

        // Check if video is already loaded
        if (videoScroll.readyState >= 1) {
            handleLoadedMetadata();
        } else {
            videoScroll.addEventListener('loadedmetadata', handleLoadedMetadata);
        }

        // Detect scroll to switch videos - Optimized for performance (Direct DOM manipulation)
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const isScrollingNow = scrollY > 50;

            if (isScrollingNow) {
                // Hide Initial Loop
                if (videoLoopRef.current) videoLoopRef.current.style.opacity = '0';
                // Show Scroll Video (if not ended)
                if (videoScrollRef.current && !isEnded) videoScrollRef.current.style.opacity = '1';
                // Pause loop to save CPU
                if (videoLoopRef.current) videoLoopRef.current.pause();

                // Hide Text
                if (heroTextRef.current) heroTextRef.current.style.opacity = '0';
            } else {
                // Show Initial Loop
                if (videoLoopRef.current) videoLoopRef.current.style.opacity = '1';
                // Hide Scroll Video
                if (videoScrollRef.current) videoScrollRef.current.style.opacity = '0';
                // Resume loop
                if (videoLoopRef.current) videoLoopRef.current.play();

                // Show Text
                if (heroTextRef.current) heroTextRef.current.style.opacity = '1';
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            videoScroll.removeEventListener('loadedmetadata', handleLoadedMetadata);
            if (scrollTriggerInstance) {
                scrollTriggerInstance.kill();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isEnded]); // Minimal dependency

    return (
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Video Container with Extended Height for Scroll */}
            <div ref={containerRef} className="relative" style={{ height: '600vh' }}>
                {/* Fixed Video Background */}
                <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">

                    {/* 1. Loop Video - Shows initially */}
                    <video
                        ref={videoLoopRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-100 transition-opacity duration-0"
                        style={{
                            willChange: 'transform, opacity',
                            objectPosition: '50% 33%',
                            transform: 'scale(1)',
                            transformOrigin: 'center center'
                        }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40_loop@sm.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* 2. Scroll Video - Shows when scrolling but not ended */}
                    <video
                        ref={videoScrollRef}
                        muted
                        playsInline
                        preload="auto"
                        className="absolute top-0 left-0 w-full h-full object-cover opacity-0 transition-opacity duration-0"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S40-scrolly@md_OPTIMIZED.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* 3. End Loop Video - Shows when animation ends */}
                    <video
                        ref={videoEndLoopRef}
                        loop
                        muted
                        playsInline
                        className={`absolute top-0 left-0 w-full h-full object-cover ${isEnded ? 'opacity-100' : 'opacity-0'}`}
                        style={{ willChange: 'opacity' }}
                    >
                        <source src="/videos-scroll/NAVIGATE_4K_S50_loop@sm.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Header - Simple and Clean */}
                    <header className="relative z-10 w-full py-6 px-4 md:px-8 flex justify-between items-center">
                        <img src="/logo-header.png" alt="Factoria" className="h-10 md:h-14 w-auto object-contain" />
                        <Link to="/login">
                            <Button
                                className="bg-[#1F345E] text-white hover:bg-[#1F345E]/90 font-semibold px-6 md:px-8 py-2 md:py-3 text-base md:text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                Entrar
                            </Button>
                        </Link>
                    </header>

                    {/* Hero Section with Split Text - Hidden when scrolling */}
                    <main
                        ref={heroTextRef}
                        className="relative z-10 w-full pl-8 md:pl-20 pr-2 md:pr-3 h-[calc(100vh-120px)] flex flex-col md:flex-row items-center md:items-start justify-start pt-8 md:pt-12 transition-opacity duration-300"
                    >
                        {/* Left Side - Title */}
                        <div className="w-full md:w-1/2 text-left animate-fade-in-left">
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight drop-shadow-lg">
                                Automatize <br />
                                seu <span className="text-[#078B48]" style={{
                                    WebkitTextStroke: '2px white'
                                }}>WhatsApp</span> <br />
                                com IA
                            </h1>
                        </div>
                    </main>

                    {/* Metrics Text Overlay - Shows during scroll (approx 30-60%) */}
                    <div
                        id="metrics-overlay"
                        className="fixed top-1/2 left-8 md:left-20 -translate-y-1/2 z-20 max-w-md opacity-0 transition-opacity duration-500 pointer-events-none"
                    >
                        <div className="space-y-6">
                            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10 transform transition-all duration-500 hover:scale-105 hover:border-[#078B48]/50 group">
                                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-[#078B48] transition-colors">Métricas em Tempo Real</h3>
                                <p className="text-lg text-gray-200 font-medium">
                                    Acompanhe o desempenho do seu time e tome decisões baseadas em dados precisos.
                                </p>
                            </div>

                            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10 transform transition-all duration-500 hover:scale-105 delay-100 hover:border-[#078B48]/50 group">
                                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-[#078B48] transition-colors">+300% em Vendas</h3>
                                <p className="text-lg text-gray-200 font-medium">
                                    Nossos clientes relatam um aumento médio de 3x no volume de vendas no primeiro mês.
                                </p>
                            </div>

                            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/10 transform transition-all duration-500 hover:scale-105 delay-200 hover:border-[#078B48]/50 group">
                                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-[#078B48] transition-colors">Automação Inteligente</h3>
                                <p className="text-lg text-gray-200 font-medium">
                                    Deixe o robô trabalhar por você enquanto foca no que realmente importa: crescer.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gradient Overlay for smooth transition to Light Theme */}
                    <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/60 to-transparent z-10 pointer-events-none" />
                </div>
            </div>

            {/* Features Section - Appears after video scroll with smooth landing */}
            <section className="relative z-20 -mt-32 bg-[#F8FAFC] pt-32 pb-24 px-4 md:px-8 overflow-hidden">
                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1E293B] mb-6">
                            O que torna o Factoria único
                        </h2>
                        <p className="text-xl text-[#475569] max-w-3xl mx-auto">
                            Recursos pensados para quem usa e para quem oferece como serviço.
                        </p>
                    </div>

                    {/* Alternating Strip Layout */}
                    <div className="flex flex-col w-full">
                        {/* Feature 1: Multiplicação de Força (Text Left, Visual Right) */}
                        <div className="w-full bg-white border-b border-slate-100 flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 md:order-1">
                                <div className="mb-8 inline-flex p-3 rounded-2xl bg-[#FF4F00]/10 text-[#FF4F00] w-fit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#1E293B] mb-6 leading-tight">
                                    Multiplicação de Força
                                </h3>
                                <p className="text-[#475569] leading-relaxed mb-8 text-xl">
                                    Você não precisa de mais atendentes. Você precisa de super-atendentes. Clone sua capacidade de atendimento instantaneamente.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Múltiplas instâncias simultâneas
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Atendimento centralizado
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Escala sem aumentar a folha
                                    </li>
                                </ul>
                            </div>
                            <div className="w-full md:w-1/2 order-1 md:order-2 min-h-[400px] bg-slate-50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-200/50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-medium text-lg">Visual Concept Area</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Funcionários Digitais (Visual Left, Text Right) */}
                        <div className="w-full bg-[#F8FAFC] border-b border-slate-200 flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 order-1 min-h-[400px] bg-white relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-slate-100/50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-medium text-lg">Visual Concept Area</span>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 text-right">
                                <div className="mb-8 inline-flex p-3 rounded-2xl bg-[#FF4F00]/10 text-[#FF4F00] ml-auto w-fit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#1E293B] mb-6 leading-tight">
                                    Funcionários Digitais (IA)
                                </h3>
                                <p className="text-[#475569] leading-relaxed mb-8 text-xl">
                                    Cada instância é equipada com um Cérebro de IA Independente (Gemini 2.0). Eles nunca dormem, nunca têm um dia ruim.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Engenharia de Prompt Personalizada
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Humanização Extrema (Voz/TTS)
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Atendimento 24/7
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 3: Controle Total (Text Left, Visual Right) */}
                        <div className="w-full bg-white border-b border-slate-100 flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 md:order-1">
                                <div className="mb-8 inline-flex p-3 rounded-2xl bg-[#FF4F00]/10 text-[#FF4F00] w-fit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#1E293B] mb-6 leading-tight">
                                    Controle Total (Tempo Real)
                                </h3>
                                <p className="text-[#475569] leading-relaxed mb-8 text-xl">
                                    Gestão não é achismo, é dado. Acompanhe sua operação com tecnologia WebSocket em tempo real.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Sem "F5" - Atualização instantânea
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Auto-Reconexão Inteligente
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg">
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        Métricas de verdade
                                    </li>
                                </ul>
                            </div>
                            <div className="w-full md:w-1/2 order-1 md:order-2 min-h-[400px] bg-slate-50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-200/50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-medium text-lg">Visual Concept Area</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature 4: Confiabilidade Enterprise (Visual Left, Text Right) */}
                        <div className="w-full bg-[#F8FAFC] border-b border-slate-200 flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 order-1 min-h-[400px] bg-white relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-slate-100/50" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-medium text-lg">Visual Concept Area</span>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center order-2 text-right">
                                <div className="mb-8 inline-flex p-3 rounded-2xl bg-[#FF4F00]/10 text-[#FF4F00] ml-auto w-fit">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold text-[#1E293B] mb-6 leading-tight">
                                    Confiabilidade Enterprise
                                </h3>
                                <p className="text-[#475569] leading-relaxed mb-8 text-xl">
                                    Sua operação não pode parar. Arquitetura robusta projetada para estabilidade máxima.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Persistência de Sessão
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Zero Configuração Repetitiva
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4 text-[#475569] text-lg justify-end">
                                        Segurança de dados
                                        <div className="p-1 rounded-full bg-[#FF4F00]/10 text-[#FF4F00]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Future Feature: Google Calendar Integration */}
                    <div className="mt-24 bg-gradient-to-br from-[#1F345E] to-[#0F1C35] border border-white/10 rounded-3xl p-8 md:p-16 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#078B48]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="w-full md:w-1/2 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#078B48] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#078B48]"></span>
                                    </span>
                                    Em Breve
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                    Integração Nativa com Google Calendar
                                </h3>
                                <p className="text-white/80 text-lg leading-relaxed mb-8">
                                    Imagine seu assistente agendando reuniões automaticamente enquanto você dorme. A integração completa com sua agenda está chegando para eliminar o "vai e vem" de horários.
                                </p>
                                <Button className="bg-white text-[#1F345E] hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                                    Entrar na Lista de Espera
                                </Button>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="relative w-full max-w-md aspect-square bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center p-8">
                                    {/* Placeholder for google_calendar_integration.png */}
                                    <div className="flex flex-col items-center gap-6 text-white/50">
                                        <div className="flex items-center gap-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#078B48]"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        </div>
                                        <span className="text-lg font-medium">Calendar + WhatsApp</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0F1C35] text-white py-16 px-4 md:px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <img src="/logo-header.png" alt="Factoria" className="h-12 w-auto mb-6 brightness-0 invert opacity-90" />
                        <p className="text-gray-400 max-w-sm leading-relaxed">
                            Transformando o atendimento via WhatsApp com inteligência artificial de ponta. Escale seu negócio sem perder a humanidade.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Produto</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Funcionalidades</a></li>
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Preços</a></li>
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Casos de Uso</a></li>
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Legal</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Termos de Uso</a></li>
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Privacidade</a></li>
                            <li><a href="#" className="hover:text-[#078B48] transition-colors">Contato</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© 2024 Factoria. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;

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
                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 transform transition-all duration-500 hover:scale-105">
                                <h3 className="text-3xl font-bold text-[#1f345e] mb-2">Métricas em Tempo Real</h3>
                                <p className="text-lg text-gray-800 font-medium">
                                    Acompanhe o desempenho do seu time e tome decisões baseadas em dados precisos.
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 transform transition-all duration-500 hover:scale-105 delay-100">
                                <h3 className="text-3xl font-bold text-[#1f345e] mb-2">+300% em Vendas</h3>
                                <p className="text-lg text-gray-800 font-medium">
                                    Nossos clientes relatam um aumento médio de 3x no volume de vendas no primeiro mês.
                                </p>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 transform transition-all duration-500 hover:scale-105 delay-200">
                                <h3 className="text-3xl font-bold text-[#1f345e] mb-2">Automação Inteligente</h3>
                                <p className="text-lg text-gray-800 font-medium">
                                    Deixe o robô trabalhar por você enquanto foca no que realmente importa: crescer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section - Appears after video scroll */}
            <section className="relative z-20 bg-white py-24 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-[#1F345E] mb-6">
                            O que torna o Factoria único
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Recursos pensados para quem usa e para quem oferece como serviço.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">IA Própria e Integrada</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Integração nativa com IA. Sem custos extras surpresa ou configurações complexas de API. Ideal para escalar.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">👥</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">Múltiplos Agentes</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Crie agentes ilimitados com comportamentos únicos. Use para diferentes setores ou configure agentes específicos.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">Comportamento Humano</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Simula tempo de leitura, digitação e pensamento. Seus clientes nunca saberão que estão falando com uma automação.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">Pipeline Visual</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Kanban com estágios de classificação. Gerencie leads do seu negócio e acompanhe oportunidades em um só lugar.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">🔗</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">Tudo Integrado</h3>
                            <p className="text-gray-600 leading-relaxed">
                                WhatsApp, IA, CRM visual e analytics em uma plataforma. Conecte suas ferramentas favoritas facilmente.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                            <div className="w-12 h-12 bg-[#1F345E]/10 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-2xl">📱</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F345E] mb-3">Multi-Instância</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Gerencie múltiplos números de WhatsApp em um painel único. Perfeito para quem tem vários negócios.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;

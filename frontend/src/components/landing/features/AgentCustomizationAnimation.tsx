import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sliders, MessageSquare, Play, Pause } from "lucide-react";

export const AgentCustomizationAnimation = () => {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const arrowVideoRef = useRef<HTMLVideoElement | null>(null);
    const playVideoRef = useRef<HTMLVideoElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Initialize audio
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const audio = new Audio("/audio/agente_ia_demo.mp3");

        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
        };

        audioRef.current = audio;

        return () => {
            window.removeEventListener('resize', checkMobile);
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    // Handle arrow video loop with delay
    useEffect(() => {
        const video = arrowVideoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setTimeout(() => {
                video.currentTime = 0;
                video.play().catch(() => { });
            }, 1000);
        };

        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
    }, [audioEnabled]);

    // Handle play button video loop with delay
    useEffect(() => {
        // Only run this effect if the video ref is populated (i.e. when !isPlaying)
        const video = playVideoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setTimeout(() => {
                video.currentTime = 0;
                video.play().catch(() => { });
            }, 500);
        };

        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
    }, [isPlaying, audioEnabled]); // Re-run when isPlaying changes as ref might become available

    const handlePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.error("Play failed:", e));
        }
    };

    // CSS filter to approximate a darker green (#027831) from a dark/black source
    // If the video is already colored, we reset it with brightness(0) (black) first
    // Note: This assumes the video has a transparent background.
    const greenFilter = "brightness(0) saturate(100%) invert(29%) sepia(85%) saturate(1638%) hue-rotate(113deg) brightness(93%) contrast(103%)";

    return (
        <div className="w-full h-full flex items-center justify-center p-2 md:p-4 relative">
            <AnimatePresence>
                {audioEnabled && (
                    <motion.video
                        ref={arrowVideoRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src="/videos/arrowgreen2.webm"
                        className="absolute w-16 h-16 md:w-20 md:h-20 pointer-events-none z-50"
                        style={{
                            top: isMobile ? '250px' : '360px',
                            left: isMobile ? '-5px' : '30px',
                            transform: "scaleY(-1)",
                            filter: greenFilter
                        }}
                        autoPlay
                        muted
                        playsInline
                    />
                )}
            </AnimatePresence>
            <div className="w-full max-w-[320px] md:max-w-[380px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform scale-[0.85] md:scale-100 origin-center relative z-10">
                {/* Header */}
                <div className="bg-slate-900 p-4 flex items-center justify-between">
                    <span className="text-white font-semibold flex items-center gap-2">
                        <Sliders size={16} className="text-[#00A947]" />
                        Configurar Agente
                    </span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-6">
                    {/* Interaction 2: Prompt Input (Typing Effect) */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                            <MessageSquare size={16} />
                            <span>Persona</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 h-24 font-mono text-xs text-slate-600 leading-relaxed overflow-hidden relative">
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {Array.from("Você é um especialista em vendas consultivas. Seu objetivo é entender a dor do cliente e propor a melhor solução...").map((char, index) => (
                                    <motion.span
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.02, delay: 1 + index * 0.03 }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 4 }}
                                className="inline-block w-1.5 h-3 bg-[#00A947] ml-1 align-middle"
                            />
                        </div>
                    </div>

                    {/* Interaction 3: Voice Toggle & Player */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-hidden transition-all duration-500">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-[#00A947]">
                                    <Mic size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-slate-700">Respostas em Áudio</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">TTS Neural</span>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div
                                className="relative cursor-pointer"
                                onClick={() => setAudioEnabled(!audioEnabled)}
                            >
                                <motion.div
                                    animate={{ backgroundColor: audioEnabled ? "#00A947" : "#cbd5e1" }}
                                    className="w-11 h-6 rounded-full"
                                >
                                    <motion.div
                                        animate={{ x: audioEnabled ? 22 : 4 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                </motion.div>
                            </div>
                        </div>

                        {/* Player (Appears when enabled) */}
                        <AnimatePresence>
                            {audioEnabled && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                    animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                    className="border-t border-slate-200/60 pt-3"
                                >
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-sm border border-slate-100 relative">
                                        <button
                                            onClick={handlePlay}
                                            className={`
                                                w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 transition-colors relative z-20 overflow-hidden
                                                ${isPlaying ? 'bg-[#00A947] hover:bg-[#008f3c]' : 'bg-transparent'}
                                            `}
                                        >
                                            {isPlaying ? (
                                                <Pause size={14} fill="currentColor" />
                                            ) : (
                                                <video
                                                    ref={playVideoRef}
                                                    src="/videos/PlayOutlier.webm"
                                                    className="w-full h-full object-cover scale-150"
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                />
                                            )}
                                        </button>

                                        {/* Waveform Visualization */}
                                        <div className="flex-1 h-8 flex items-center justify-between gap-2 px-1">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(12)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{
                                                            height: isPlaying ? [8, 24, 12, 32, 16, 8][i % 6] : 4,
                                                            backgroundColor: isPlaying ? "#00A947" : "#cbd5e1"
                                                        }}
                                                        transition={{
                                                            duration: 0.4,
                                                            repeat: Infinity,
                                                            repeatType: "reverse",
                                                            delay: i * 0.05,
                                                            ease: "easeInOut"
                                                        }}
                                                        className="w-1 rounded-full bg-slate-300"
                                                        style={{ height: 4 }}
                                                    />
                                                ))}
                                            </div>

                                            {!isPlaying && (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-[10px] text-slate-400 font-medium mr-1 truncate max-w-[80px] md:max-w-none"
                                                >
                                                    Ouvir exemplo
                                                </motion.span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

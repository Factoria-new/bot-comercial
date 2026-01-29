import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sliders, MessageSquare, Play, Pause } from "lucide-react";

export const AgentCustomizationAnimation = () => {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio
    useEffect(() => {
        const audio = new Audio("/audio/agente_ia_demo.mp3");

        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
        };

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

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

    return (
        <div className="w-full h-full flex items-center justify-center p-2 md:p-4">
            <div className="w-full max-w-[320px] md:max-w-[380px] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform scale-[0.85] md:scale-100 origin-center">
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
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-sm border border-slate-100">
                                        <button
                                            onClick={handlePlay}
                                            className="w-8 h-8 rounded-full bg-[#00A947] flex items-center justify-center text-white shrink-0 hover:bg-[#008f3c] transition-colors"
                                        >
                                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
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
                                                    className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-1"
                                                >
                                                    Clique para ouvir o assistente
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

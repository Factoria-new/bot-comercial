import { motion } from "framer-motion";
import { Mic, Sliders, MessageSquare } from "lucide-react";

export const AgentCustomizationAnimation = () => {
    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl overflow-hidden p-8">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 p-4 flex items-center justify-between">
                    <span className="text-white font-semibold">Configurar Agente</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Interaction 1: Tone Slider */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                            <Sliders size={16} />
                            <span>Tom de Voz</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden">
                            <motion.div
                                initial={{ width: "20%" }}
                                whileInView={{ width: "80%" }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                className="absolute top-0 left-0 h-full bg-[#00A947] rounded-full"
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                            <span>Formal</span>
                            <span>Amigável</span>
                        </div>
                    </div>

                    {/* Interaction 2: Prompt Input */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                            <MessageSquare size={16} />
                            <span>Persona</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <motion.div
                                initial={{ opacity: 0.5 }}
                                whileInView={{ opacity: 1 }}
                                className="space-y-2"
                            >
                                <div className="h-2 bg-slate-200 rounded w-full animate-pulse"></div>
                                <div className="h-2 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                                <div className="h-2 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Interaction 3: Voice Toggle */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-[#00A947]">
                                <Mic size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-700">Respostas em Áudio</span>
                                <span className="text-xs text-slate-500">TTS Neural</span>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="w-10 h-6 bg-[#00A947] rounded-full relative cursor-pointer">
                            <motion.div
                                className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                transition={{ type: "spring" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

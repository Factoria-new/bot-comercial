import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, ExternalLink, Volume2, Sparkles, X } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { useAgentAudio } from "@/hooks/useAgentAudio";
import { getRandomAudio } from "@/lib/audioMappings";

interface ApiKeyModalProps {
    open: boolean;
    onComplete: (apiKey: string) => void;
    onClose?: () => void;
}

export function ApiKeyModal({ open, onComplete, onClose }: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState("");
    const [currentAudioText, setCurrentAudioText] = useState<string | null>(null);
    const hasPlayedAudio = useRef(false);

    // Audio Hooks
    const { stop: stopTTS } = useTTS();
    const { playIntegrationAudio, stopIntegrationAudio, integrationVoiceLevel } = useAgentAudio({ stopTTS });

    // Play Audio on Mount (Once)
    useEffect(() => {
        if (open && !hasPlayedAudio.current) {
            hasPlayedAudio.current = true;
            const variation = getRandomAudio('intro_apikey');
            if (variation && variation.path) {
                console.log("🎵 Playing API Key Intro:", variation.path);
                setCurrentAudioText(variation.text);
                playIntegrationAudio(variation.path, 1000, () => {
                    setCurrentAudioText(null);
                });
            }
        }
        return () => {
            // Cleanup handled by hook potentially
        };
    }, [open, playIntegrationAudio]);


    const handleSubmit = async () => {
        setError("");
        if (!apiKey.trim()) {
            setError("Por favor, insira uma chave de API válida.");
            return;
        }

        setIsValidating(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/api/users/apikey`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ apiKey })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao salvar a chave.');
            }

            // Save the new token if provided (contains updated user state)
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            setTimeout(() => {
                setIsValidating(false);
                // We keep local storage for quick checking if needed, but primary is backend
                localStorage.setItem("user_gemini_api_key", apiKey);
                stopIntegrationAudio();
                onComplete(apiKey);
            }, 800);

        } catch (err: any) {
            console.error(err);
            setIsValidating(false);
            setError(err.message || "Erro ao conectar com o servidor.");
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            >
                {/* Backdrop with AI Animation */}
                <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm z-0">
                    {/* Animated Orbs Background */}
                    <div className="absolute top-[50%] left-[50%] w-[100vw] h-[100vh] translate-x-[-50%] translate-y-[-50%] pointer-events-none overflow-hidden">
                        <div
                            className="absolute top-[40%] left-[50%] w-[60vw] h-[60vh] mix-blend-screen opacity-30 blur-[100px] rounded-full bg-purple-600 transition-all duration-75 ease-out will-change-transform"
                            style={{ transform: `translate(-50%, -50%) scale(${1 + integrationVoiceLevel * 1.5})` }}
                        />
                        <div
                            className="absolute top-[60%] left-[50%] w-[50vw] h-[50vh] mix-blend-screen opacity-20 blur-[120px] rounded-full bg-indigo-600 transition-all duration-100 ease-out will-change-transform"
                            style={{ transform: `translate(-50%, -50%) scale(${1 + integrationVoiceLevel * 1})` }}
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-2xl bg-white/5 border border-white/10 shadow-2xl shadow-purple-900/20 rounded-3xl overflow-hidden flex flex-col relative z-10 backdrop-blur-xl"
                >
                    {/* Header similar to WizardModal */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Configuração Inicial
                            </h2>
                            {currentAudioText && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 bg-purple-500/20 text-purple-200 text-xs px-3 py-1.5 rounded-full mt-2 border border-purple-500/20"
                                >
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    <span className="truncate max-w-[350px] font-medium">Lia: "{currentAudioText}"</span>
                                </motion.div>
                            )}
                        </div>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white/50 hover:text-white hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Description */}
                        <div className="text-white/80 text-sm leading-relaxed">
                            <p className="mb-4 bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl">
                                Para garantir total privacidade e controle, o sistema utiliza sua própria chave de API do Gemini (Google AI).
                            </p>
                        </div>

                        {/* Input Section */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1 flex justify-between items-center">
                                <span>Gemini API Key</span>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors normal-case bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40"
                                >
                                    Gerar Chave Grátis <ExternalLink className="w-3 h-3" />
                                </a>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-purple-400 transition-colors z-10" />
                                <Input
                                    type="password"
                                    placeholder="Começa com AIza..."
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        setError("");
                                    }}
                                    className="relative z-10 pl-11 bg-black/40 border-white/10 focus:border-purple-500/50 text-white placeholder:text-white/20 h-14 rounded-xl transition-all shadow-inner"
                                />
                            </div>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-red-400 text-xs ml-1 flex items-center gap-1.5"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error}
                                </motion.p>
                            )}
                        </div>

                        {/* Video Tutorial Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                                </div>
                                <span className="text-sm font-medium text-white/90">Tutorial Rápido (2 min)</span>
                            </div>

                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/bgbY41qN4-M"
                                    title="Getting started with Gemini API"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="absolute inset-0"
                                ></iframe>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={isValidating || !apiKey}
                                className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-3 border border-white/10"
                            >
                                {isValidating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        Continuar <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}


"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const VOICE_OPTIONS = [
    { value: 'Kore', label: 'Kore', gender: 'Feminino' },
    { value: 'Aoede', label: 'Aoede', gender: 'Feminino' },
    { value: 'Zephyr', label: 'Zephyr', gender: 'Feminino' },
    { value: 'Charon', label: 'Charon', gender: 'Masculino' },
    { value: 'Fenrir', label: 'Fenrir', gender: 'Masculino' },
    { value: 'Puck', label: 'Puck', gender: 'Não-binário' },
    { value: 'Orus', label: 'Orus', gender: 'Masculino' },
];

interface VoiceCardDarkProps {
    sessionId?: string;
}

export const VoiceCardDark: React.FC<VoiceCardDarkProps> = ({ sessionId = '1' }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const isPro = user?.role === 'pro' || user?.role === 'admin';

    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [ttsVoice, setTtsVoice] = useState('Kore');
    const [ttsRules, setTtsRules] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);

    // Load initial config from backend
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003'}/api/whatsapp/config/${sessionId}`);
                const data = await res.json();
                if (data.success && data.config) {
                    setTtsEnabled(data.config.ttsEnabled || false);
                    setTtsVoice(data.config.ttsVoice || 'Kore');
                    setTtsRules(data.config.ttsRules || '');
                }
            } catch (error) {
                console.error('Failed to load TTS config:', error);
            }
        };
        loadConfig();
    }, [sessionId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003'}/api/whatsapp/config/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ttsEnabled, ttsVoice, ttsRules })
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: "Configuração salva!",
                    description: ttsEnabled ? `Voz ${ttsVoice} ativada.` : "Respostas em áudio desativadas.",
                });
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar a configuração.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const selectedVoice = VOICE_OPTIONS.find(v => v.value === ttsVoice);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
        >
            {/* Header - Always visible */}
            <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        ttsEnabled ? "bg-emerald-500/20" : "bg-white/10"
                    )}>
                        {ttsEnabled ? (
                            <Volume2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                            <MicOff className="w-6 h-6 text-white/40" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            Voz do Agente
                            {!isPro && (
                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                                    PRO
                                </span>
                            )}
                        </h3>
                        <p className="text-white/50 text-sm">
                            {ttsEnabled ? `${selectedVoice?.label} • Ativo` : "Desativado"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Switch
                        checked={ttsEnabled}
                        onCheckedChange={(checked) => {
                            if (!isPro) {
                                toast({
                                    title: "Recurso PRO",
                                    description: "Faça upgrade para usar respostas em áudio.",
                                    variant: "destructive"
                                });
                                return;
                            }
                            setTtsEnabled(checked);
                            if (checked) setIsExpanded(true);
                        }}
                        disabled={!isPro}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/10"
                    >
                        <div className="p-6 space-y-5">
                            {/* Voice Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Voz do Assistente</label>
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowVoiceDropdown(!showVoiceDropdown); }}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mic className="w-4 h-4 text-emerald-400" />
                                            <span className="font-medium text-white">{selectedVoice?.label}</span>
                                            <span className="text-xs text-white/50">({selectedVoice?.gender})</span>
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-white/40 transition-transform",
                                            showVoiceDropdown && "rotate-180"
                                        )} />
                                    </button>

                                    <AnimatePresence>
                                        {showVoiceDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-20 w-full mt-2 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                                            >
                                                {VOICE_OPTIONS.map((voice) => (
                                                    <button
                                                        key={voice.value}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTtsVoice(voice.value);
                                                            setShowVoiceDropdown(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors",
                                                            ttsVoice === voice.value && "bg-emerald-500/20"
                                                        )}
                                                    >
                                                        <span className="font-medium text-white">{voice.label}</span>
                                                        <span className="text-xs text-white/50">{voice.gender}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Rules Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">
                                    Regras de Áudio
                                </label>
                                <textarea
                                    value={ttsRules}
                                    onChange={(e) => setTtsRules(e.target.value)}
                                    placeholder="Ex: Mande áudio somente quando receber áudio"
                                    className="w-full min-h-[70px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 resize-none"
                                />
                                <p className="text-xs text-white/40">
                                    Deixe vazio para sempre enviar áudio
                                </p>
                            </div>

                            {/* Save Button */}
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                                disabled={isSaving || !ttsEnabled}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
                            >
                                {isSaving ? "Salvando..." : "Salvar Configurações"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VoiceCardDark;

"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const VOICE_OPTIONS = [
    { value: 'Kore', label: 'Kore', gender: 'Feminino', description: 'Voz padrão' },
    { value: 'Aoede', label: 'Aoede', gender: 'Feminino', description: 'Suave' },
    { value: 'Zephyr', label: 'Zephyr', gender: 'Feminino', description: 'Expressiva' },
    { value: 'Charon', label: 'Charon', gender: 'Masculino', description: 'Profunda' },
    { value: 'Fenrir', label: 'Fenrir', gender: 'Masculino', description: 'Enérgica' },
    { value: 'Puck', label: 'Puck', gender: 'Não-binário', description: 'Versátil' },
    { value: 'Orus', label: 'Orus', gender: 'Masculino', description: 'Calma' },
];

interface VoiceCardProps {
    sessionId?: string;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ sessionId = '1' }) => {
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
                const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
                const res = await fetch(`${backendUrl}/api/whatsapp/config/${sessionId}`);
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
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const res = await fetch(`${backendUrl}/api/whatsapp/config/${sessionId}`, {
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
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
        >
            {/* Header */}
            <div
                className="p-6 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-lg transition-colors",
                        ttsEnabled ? "bg-emerald-100" : "bg-gray-100"
                    )}>
                        {ttsEnabled ? (
                            <Volume2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                            <MicOff className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Voz do Agente</h3>
                        <p className="text-sm text-gray-500">
                            {ttsEnabled ? `Voz: ${selectedVoice?.label}` : "Desativado"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isPro && (
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                            PRO
                        </span>
                    )}
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
                            setIsExpanded(checked);
                        }}
                        disabled={!isPro}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                    <ChevronDown className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && ttsEnabled && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100"
                    >
                        <div className="p-6 space-y-4">
                            {/* Voice Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Voz do Assistente</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-left hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mic className="w-4 h-4 text-emerald-500" />
                                            <div>
                                                <span className="font-medium text-gray-900">{selectedVoice?.label}</span>
                                                <span className="text-xs text-gray-500 ml-2">({selectedVoice?.gender})</span>
                                            </div>
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-gray-400 transition-transform",
                                            showVoiceDropdown && "rotate-180"
                                        )} />
                                    </button>

                                    <AnimatePresence>
                                        {showVoiceDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                                            >
                                                {VOICE_OPTIONS.map((voice) => (
                                                    <button
                                                        key={voice.value}
                                                        onClick={() => {
                                                            setTtsVoice(voice.value);
                                                            setShowVoiceDropdown(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                                                            ttsVoice === voice.value && "bg-emerald-50"
                                                        )}
                                                    >
                                                        <div>
                                                            <span className="font-medium text-gray-900">{voice.label}</span>
                                                            <span className="text-xs text-gray-500 ml-2">({voice.gender})</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{voice.description}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Rules Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Regras de Áudio (Linguagem Natural)
                                </label>
                                <Textarea
                                    value={ttsRules}
                                    onChange={(e) => setTtsRules(e.target.value)}
                                    placeholder="Ex: Mande áudio somente quando receber mensagem de áudio"
                                    className="min-h-[80px] bg-gray-50 border-gray-200 resize-none"
                                />
                                <p className="text-xs text-gray-500">
                                    Deixe vazio para sempre enviar áudio, ou defina regras personalizadas.
                                </p>
                            </div>

                            {/* Save Button */}
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
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

export default VoiceCard;

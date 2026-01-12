"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    X,
    MessageSquare,
    ChevronRight,
    ChevronDown,
    Link2,
    LogOut,
    Volume2,
    Mic,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { Integration } from "@/types/onboarding";
import { BrandIcons } from "@/components/ui/brand-icons";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const VOICE_OPTIONS = [
    { value: 'Kore', label: 'Kore', gender: 'Feminino' },
    { value: 'Aoede', label: 'Aoede', gender: 'Feminino' },
    { value: 'Zephyr', label: 'Zephyr', gender: 'Feminino' },
    { value: 'Charon', label: 'Charon', gender: 'Masculino' },
    { value: 'Fenrir', label: 'Fenrir', gender: 'Masculino' },
    { value: 'Puck', label: 'Puck', gender: 'Não-binário' },
    { value: 'Orus', label: 'Orus', gender: 'Masculino' },
];

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings") => void;
    currentPage: string;
    connectedInstances?: number;
    totalInstances?: number;
    integrations?: Integration[];
    onLogout?: () => void;
    forceExpandIntegrations?: boolean;
    onIntegrationClick?: (id: string) => void;
    onIntegrationDisconnect?: (id: string) => void;
    sessionId?: string;
}

export default function DashboardSidebar({
    isOpen,
    onClose,
    onNavigate,
    currentPage,
    connectedInstances = 0,
    totalInstances = 0,
    integrations = [],
    onLogout,
    forceExpandIntegrations = false,
    onIntegrationClick,
    onIntegrationDisconnect,
    sessionId = '1'
}: DashboardSidebarProps) {
    const { isConnected } = useSocket();
    const { user } = useAuth();
    const { toast } = useToast();

    // Integrations keys are numbers in the array, but we want to know if specific integrations are active
    const activeIntegrationsCount = integrations.filter(i => i.connected).length;
    const connectedIntegrations = connectedInstances > 0 ? connectedInstances : activeIntegrationsCount;

    const [integrationsExpanded, setIntegrationsExpanded] = useState(forceExpandIntegrations);

    // TTS State
    const [ttsExpanded, setTtsExpanded] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [ttsVoice, setTtsVoice] = useState('Kore');
    const [ttsRules, setTtsRules] = useState({
        audioOnRequest: false,      // Regra 1: Áudio somente quando solicitado
        audioOnAudioReceived: false, // Regra 2: Áudio quando recebe áudio
        audioOnly: false            // Regra 3: Somente áudio (exclusiva)
    });
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
    const [isSavingTts, setIsSavingTts] = useState(false);

    const isPro = user?.role === 'pro' || user?.role === 'admin';
    const selectedVoice = VOICE_OPTIONS.find(v => v.value === ttsVoice);

    // Initial load of configurations (TTS, etc)
    useEffect(() => {
        loadTtsConfig();
    }, [sessionId]); // Reload if sessionId changes

    const loadTtsConfig = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
            const response = await fetch(`${backendUrl}/api/whatsapp/config/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.config) {
                    setTtsEnabled(data.config.ttsEnabled || false);
                    setTtsVoice(data.config.ttsVoice || 'Kore');
                    // Handle both old string format and new object format
                    const rules = data.config.ttsRules;
                    if (typeof rules === 'object' && rules !== null) {
                        setTtsRules({
                            audioOnRequest: rules.audioOnRequest || false,
                            audioOnAudioReceived: rules.audioOnAudioReceived || false,
                            audioOnly: rules.audioOnly || false
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading TTS config:', error);
        }
    };

    const handleSaveTts = async () => {
        if (!isPro) return;
        setIsSavingTts(true);
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
            const response = await fetch(`${backendUrl}/api/whatsapp/config/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ttsEnabled,
                    ttsVoice,
                    ttsRules
                })
            });

            if (response.ok) {
                toast({
                    title: "Configurações salvas",
                    description: "As preferências de voz foram atualizadas.",
                    className: "bg-emerald-500 text-white border-0"
                });
            } else {
                throw new Error('Falha ao salvar');
            }
        } catch (error) {
            console.error('Error saving TTS config:', error);
            toast({
                title: "Erro ao salvar",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setIsSavingTts(false);
        }
    };



    // Effect to handle forced expansion with delay
    useEffect(() => {
        if (forceExpandIntegrations && isOpen) {
            const timer = setTimeout(() => {
                setIntegrationsExpanded(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [forceExpandIntegrations, isOpen]);



    const menuItems = [
        {
            id: "chat",
            label: "Chat",
            icon: MessageSquare,
            description: "Tela inicial",
        },
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar - Dark Mode com gradiente */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50",
                    "bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950",
                    "border-r border-white/10 shadow-2xl",
                    "transform transition-transform duration-300 ease-out",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-header.png"
                            alt="Factoria"
                            className="h-8 w-auto"
                        />
                        <div>
                            <h2 className="text-white font-semibold text-sm">Factoria</h2>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        isConnected ? "bg-emerald-400" : "bg-red-400"
                                    )}
                                />
                                <span className="text-xs text-white/60">
                                    {isConnected ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="flex-shrink-0 p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.email}
                            </p>
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    user?.role === "pro" || user?.role === "admin"
                                        ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/30"
                                        : "text-white/60 bg-white/10"
                                )}
                            >
                                {user?.role === "pro" || user?.role === "admin" ? "PRO" : "BÁSICO"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu Items - Scrollable */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* Regular menu items */}
                    {menuItems.slice(0, 1).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/10",
                                currentPage === item.id
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "text-white/80 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-white/40">{item.description}</p>
                            </div>
                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-400" : "text-white/40"
                                )}
                            />
                        </button>
                    ))}

                    {/* Integrations - Expandable */}
                    <div>
                        <button
                            onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/10",
                                integrationsExpanded
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "text-white/80 hover:text-white"
                            )}
                        >
                            <Link2
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    integrationsExpanded
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">Integrações</p>
                                <p className="text-xs text-white/40">{connectedIntegrations} conectada(s)</p>
                            </div>
                            {connectedIntegrations > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {connectedIntegrations}
                                </span>
                            )}
                            {integrationsExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                            )}
                        </button>

                        {/* Expanded Integrations List */}
                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-300",
                                integrationsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}
                        >
                            <div className="pl-4 pr-2 py-2 space-y-1">
                                {integrations.map((integration) => {
                                    const Icon = BrandIcons[integration.icon];
                                    return (
                                        <div
                                            key={integration.id}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                                "bg-white/5 border",
                                                integration.connected
                                                    ? "border-emerald-500/30"
                                                    : "border-white/10"
                                            )}
                                        >
                                            <button
                                                onClick={() => !integration.connected && onIntegrationClick?.(integration.id)}
                                                className="flex-1 flex items-center gap-3 text-left w-full min-w-0"
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: integration.color }}
                                                >
                                                    {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">
                                                        {integration.name}
                                                    </p>
                                                    <p className="text-[10px] text-white/50">
                                                        {integration.connected ? "Conectado" : "Conectar"}
                                                    </p>
                                                </div>
                                            </button>

                                            {integration.connected ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onIntegrationDisconnect?.(integration.id);
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded-full transition-colors group/disconnect"
                                                    title="Desconectar"
                                                >
                                                    <LogOut className="w-4 h-4 text-red-400 group-hover/disconnect:text-red-300" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onIntegrationClick?.(integration.id)}
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Respostas em Áudio - TTS Section */}
                    <div>
                        <button
                            onClick={() => setTtsExpanded(!ttsExpanded)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/10",
                                ttsExpanded
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "text-white/80 hover:text-white"
                            )}
                        >
                            <Volume2
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    ttsExpanded || ttsEnabled
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">Respostas em Áudio</p>
                                <p className="text-xs text-white/40">
                                    {ttsEnabled ? `${selectedVoice?.label} • Ativo` : "Desativado"}
                                </p>
                            </div>
                            {ttsEnabled && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ON
                                </span>
                            )}
                            {ttsExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                            )}
                        </button>

                        {/* Expanded TTS Config */}
                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-300",
                                ttsExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                            )}
                        >
                            <div className="pl-4 pr-2 py-3 space-y-3">
                                {/* Toggle */}
                                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white/80">Ativar TTS</span>
                                        {!isPro && (
                                            <span className="text-[9px] font-bold text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <Switch
                                        checked={ttsEnabled}
                                        onCheckedChange={(checked) => {
                                            if (!isPro) {
                                                toast({ title: "Recurso PRO", description: "Faça upgrade.", variant: "destructive" });
                                                return;
                                            }
                                            setTtsEnabled(checked);
                                        }}
                                        disabled={!isPro}
                                        className="data-[state=checked]:bg-emerald-500 scale-90"
                                    />
                                </div>

                                {ttsEnabled && (
                                    <>
                                        {/* Voice Selector */}
                                        <div className="px-3">
                                            <label className="text-xs text-white/50 mb-1.5 block">Voz</label>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                                                    className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>{selectedVoice?.label}</span>
                                                        <span className="text-white/40 text-xs">({selectedVoice?.gender})</span>
                                                    </div>
                                                    <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform", showVoiceDropdown && "rotate-180")} />
                                                </button>

                                                {showVoiceDropdown && (
                                                    <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl overflow-hidden">
                                                        {VOICE_OPTIONS.map((voice) => (
                                                            <button
                                                                key={voice.value}
                                                                onClick={() => { setTtsVoice(voice.value); setShowVoiceDropdown(false); }}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors",
                                                                    ttsVoice === voice.value && "bg-emerald-500/20 text-emerald-400"
                                                                )}
                                                            >
                                                                <span className="text-white">{voice.label}</span>
                                                                <span className="text-white/40 text-xs">{voice.gender}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rules - Predefined Toggles */}
                                        <div className="px-3 space-y-1">
                                            <label className="text-xs text-white/50 mb-1.5 block">Regras de Áudio</label>

                                            {/* Rule 1: Audio on request */}
                                            <div
                                                className={cn(
                                                    "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                                                    ttsRules.audioOnly ? "opacity-50" : "hover:bg-white/5 cursor-pointer"
                                                )}
                                                onClick={() => {
                                                    if (!ttsRules.audioOnly) {
                                                        setTtsRules(prev => ({ ...prev, audioOnRequest: !prev.audioOnRequest }))
                                                    }
                                                }}
                                            >
                                                <span className="text-xs text-white/80">Áudio somente quando solicitado</span>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                                                    ttsRules.audioOnRequest
                                                        ? "border-emerald-500 bg-emerald-500"
                                                        : "border-white/30 bg-transparent"
                                                )}>
                                                    {ttsRules.audioOnRequest && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rule 2: Audio when receiving audio */}
                                            <div
                                                className={cn(
                                                    "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                                                    ttsRules.audioOnly ? "opacity-50" : "hover:bg-white/5 cursor-pointer"
                                                )}
                                                onClick={() => {
                                                    if (!ttsRules.audioOnly) {
                                                        setTtsRules(prev => ({ ...prev, audioOnAudioReceived: !prev.audioOnAudioReceived }))
                                                    }
                                                }}
                                            >
                                                <span className="text-xs text-white/80">Áudio quando recebe áudio</span>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                                                    ttsRules.audioOnAudioReceived
                                                        ? "border-emerald-500 bg-emerald-500"
                                                        : "border-white/30 bg-transparent"
                                                )}>
                                                    {ttsRules.audioOnAudioReceived && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rule 3: Audio only (exclusive) */}
                                            <div
                                                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => setTtsRules({
                                                    audioOnRequest: false,
                                                    audioOnAudioReceived: false,
                                                    audioOnly: !ttsRules.audioOnly
                                                })}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/80">Somente áudio</span>
                                                    <span className="text-[10px] text-amber-400/70">(exclusiva)</span>
                                                </div>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                                                    ttsRules.audioOnly
                                                        ? "border-emerald-500 bg-emerald-500"
                                                        : "border-white/30 bg-transparent"
                                                )}>
                                                    {ttsRules.audioOnly && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Save */}
                                        <div className="px-3">
                                            <Button
                                                onClick={handleSaveTts}
                                                disabled={isSavingTts}
                                                size="sm"
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2"
                                            >
                                                {isSavingTts ? "Salvando..." : "Salvar"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rest of menu items */}
                    {menuItems.slice(1).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/10",
                                currentPage === item.id
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "text-white/80 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-white/40">{item.description}</p>
                            </div>

                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-400" : "text-white/40"
                                )}
                            />
                        </button>
                    ))}
                </nav>

                {/* Footer with Logout */}
                <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20 space-y-3">
                    {onLogout && (
                        <button
                            onClick={() => {
                                onLogout();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 group"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sair da conta</span>
                        </button>
                    )}
                    <p className="text-xs text-white/30 text-center">
                        © {new Date().getFullYear()} Factoria Assistant
                    </p>
                </div>
            </div>
        </>
    );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit3, Upload, Save, RotateCcw, FileText, Check, Sparkles, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promptService } from "@/services/promptService";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useSocket } from "@/contexts/SocketContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import LiaSidebar from "@/components/LiaSidebar";
import WhatsAppConnectionModal from "@/components/WhatsAppConnectionModal";
import { Integration } from "@/types/onboarding";
import { motion } from "framer-motion";

interface Metrics {
    totalMessages: number;
    newContacts: number;
    activeChats: number;
}

const MeuPrompt = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { socket } = useSocket();

    // Sidebar and Lia state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLiaChatOpen, setIsLiaChatOpen] = useState(false);
    const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);

    // Prompt state
    const [prompt, setPrompt] = useState<string>('');
    const [originalPrompt, setOriginalPrompt] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    // Metrics for Lia sidebar
    const [metrics, setMetrics] = useState<Metrics>({
        totalMessages: 0,
        newContacts: 0,
        activeChats: 0
    });

    // WhatsApp Integration Hook
    const {
        instances: whatsappInstances,
        handleGenerateQR,
        modalState: whatsappModalState,
        closeModal: closeWhatsappModal,
        handleDisconnect
    } = useWhatsAppInstances();

    const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;
    const currentSessionId = String(whatsappInstances[0]?.id || '1');

    const integrations: Integration[] = [
        { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
        { id: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: 'google_calendar', connected: false },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', connected: false },
    ];

    // Socket metrics listener
    useEffect(() => {
        if (!socket) return;

        socket.on('metrics-update', (newMetrics: Metrics) => {
            setMetrics(newMetrics);
        });

        return () => {
            socket.off('metrics-update');
        };
    }, [socket]);

    // Load prompt on mount
    useEffect(() => {
        const loadPrompt = async () => {
            setIsLoading(true);
            try {
                const data = await promptService.getPrompt();
                if (data.success && data.prompt) {
                    setPrompt(data.prompt);
                    setOriginalPrompt(data.prompt);
                }
            } catch (error) {
                console.error('Error loading prompt:', error);
                toast({
                    title: "Erro ao carregar",
                    description: "Não foi possível carregar seu prompt.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadPrompt();
    }, []);

    // Track changes
    useEffect(() => {
        setHasChanges(prompt !== originalPrompt);
    }, [prompt, originalPrompt]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };



    const handleSave = async () => {
        if (!prompt.trim()) {
            toast({
                title: "Prompt vazio",
                description: "O prompt não pode estar vazio.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const result = await promptService.savePrompt(prompt);

            if (result.success) {
                setOriginalPrompt(prompt);
                setIsEditing(false);
                setHasChanges(false);
                toast({
                    title: "Prompt salvo!",
                    description: "Suas alterações foram salvas com sucesso.",
                    className: "bg-emerald-500 text-white border-0"
                });
            } else {
                throw new Error(result.error || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Error saving prompt:', error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar o prompt. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevert = () => {
        setPrompt(originalPrompt);
        setIsEditing(false);
        setHasChanges(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
            const response = await fetch(`${backendUrl}/api/agent/upload-prompt`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.text) {
                setPrompt(data.text);
                setIsEditing(true);
                toast({
                    title: "Arquivo carregado",
                    description: `${data.text.length} caracteres extraídos. Revise e salve.`,
                    className: "bg-blue-500 text-white border-0"
                });
            } else {
                throw new Error(data.error || 'Erro ao processar arquivo');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Erro no upload",
                description: "Não foi possível processar o arquivo.",
                variant: "destructive"
            });
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="text-white text-lg">Carregando prompt...</div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f0a29] to-[#1a0a2e]">
                {/* Hamburger Menu - Always visible */}
                <div className="fixed top-4 left-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-white/70 hover:bg-white/10"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-10 bg-black/50 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Meu Prompt</h1>
                                    <p className="text-xs text-white/50">Gerencie a personalidade do seu agente</p>
                                </div>
                            </div>
                        </div>

                        {hasChanges && (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                {isSaving ? (
                                    <>Salvando...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-5xl mx-auto px-6 py-8">
                    {/* Actions Bar */}
                    <div className="flex items-center gap-3 mb-6">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                        ) : (
                            <Button
                                onClick={handleRevert}
                                variant="outline"
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                        )}

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Substituir Prompt
                        </Button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.pdf,.docx"
                            className="hidden"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>{prompt.length.toLocaleString()} caracteres</span>
                        </div>
                        {hasChanges && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span>Alterações não salvas</span>
                            </div>
                        )}
                    </div>

                    {/* Prompt Textarea */}
                    {prompt ? (
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            readOnly={!isEditing}
                            className={`
                                w-full min-h-[60vh] p-6 rounded-2xl resize-none transition-all
                                bg-white/5 border border-white/10 text-white/90 text-sm leading-relaxed
                                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                                ${isEditing ? 'bg-white/10 border-purple-500/30' : 'cursor-default'}
                            `}
                            placeholder="Seu prompt aparecerá aqui..."
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-white/30" />
                            </div>
                            <p className="text-white/50 mb-4">Nenhum prompt configurado</p>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-purple-500 hover:bg-purple-600 text-white"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Fazer Upload
                            </Button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Alterações são aplicadas automaticamente ao seu agente após salvar</span>
                    </div>
                </main>
            </div>

            {/* Dashboard Sidebar */}
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => { setIsSidebarOpen(false); setShouldExpandIntegrations(false); }}
                onNavigate={() => { }}
                currentPage="my-prompt"
                integrations={integrations}
                onLogout={handleLogout}
                forceExpandIntegrations={shouldExpandIntegrations}
                onIntegrationDisconnect={(id) => {
                    if (id === 'whatsapp' && whatsappInstances.length > 0) {
                        handleDisconnect();
                    }
                }}
                sessionId={currentSessionId}
                onIntegrationClick={async (id) => {
                    if (id === 'whatsapp') {
                        if (!isWhatsAppConnected) {
                            handleGenerateQR(1);
                        }
                    } else {
                        toast({
                            title: "Em breve",
                            description: "Integração disponível em breve.",
                        });
                    }
                }}
                onOpenLiaChat={() => setIsLiaChatOpen(true)}
            />

            {/* WhatsApp Modal */}
            <WhatsAppConnectionModal
                isOpen={whatsappModalState.isOpen}
                onClose={closeWhatsappModal}
                modalState={whatsappModalState}
                instance={whatsappInstances[0]}
                onGenerateQR={handleGenerateQR}
                onDisconnect={handleDisconnect}
            />

            {/* Lia Chat Sidebar */}
            <LiaSidebar
                isOpen={isLiaChatOpen}
                onClose={() => setIsLiaChatOpen(false)}
                metrics={metrics}
            />

            {/* Floating Lia Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                onClick={() => setIsLiaChatOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-30 group"
            >
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />

                {/* Avatar */}
                <span className="relative z-10 font-bold text-2xl">L</span>

                {/* Tooltip */}
                <div className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-white/10">
                    Falar com a Lia
                </div>
            </motion.button>
        </>
    );
};

export default MeuPrompt;

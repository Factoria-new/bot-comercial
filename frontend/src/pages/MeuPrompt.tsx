import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, Upload, Save, RotateCcw, FileText, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promptService } from "@/services/promptService";
import { PromptEditChat } from "@/components/PromptEditChat";
import Lottie from "lottie-react";
import { BusinessSettingsModal } from "@/components/BusinessSettingsModal";
import Layout from "@/components/Layout";
import LottieLoader from "@/components/LottieLoader";

const MeuPrompt = () => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Prompt state
    const [prompt, setPrompt] = useState<string>('');
    const [originalPrompt, setOriginalPrompt] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [successAnimationData, setSuccessAnimationData] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isBusinessSettingsOpen, setIsBusinessSettingsOpen] = useState(false);

    useEffect(() => {
        fetch('/lotties/success.json')
            .then(res => res.json())
            .then(data => setSuccessAnimationData(data))
            .catch(err => console.error("Failed to load Lottie:", err));
    }, []);

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

    const handleSave = async () => {
        // Validation removed to allow saving empty prompt

        setIsSaving(true);
        try {
            const result = await promptService.savePrompt(prompt);

            if (result.success) {
                setOriginalPrompt(prompt);
                setIsEditing(false);
                setHasChanges(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2500);

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
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
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

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return <LottieLoader />;
    }

    return (
        <Layout currentPage="my-prompt" hideLiaOnMobile={isBusinessSettingsOpen}>
            <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0f0a29] to-[#1a0a2e]">
                {/* Header */}
                <header className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-white">Meu Prompt</h1>
                            <p className="text-[11px] sm:text-xs text-white/50">Gerencie a personalidade do seu agente</p>
                        </div>
                    </div>

                    {(hasChanges || showSuccess) && (
                        showSuccess && successAnimationData ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md px-4 sm:px-6 py-2 flex items-center justify-center min-w-[120px] sm:min-w-[140px] h-9 sm:h-10 w-full sm:w-auto">
                                <Lottie animationData={successAnimationData} loop={false} className="h-7 w-7 sm:h-8 sm:w-8" />
                            </div>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto text-sm"
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
                        )
                    )}
                </header>

                {/* Main Content */}
                <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                            >
                                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Editar
                            </Button>
                        ) : (
                            <Button
                                onClick={handleRevert}
                                variant="outline"
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                            >
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Cancelar
                            </Button>
                        )}

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                        >
                            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            <span className="hidden xs:inline">Substituir </span>Prompt
                        </Button>

                        <Button
                            onClick={() => setIsBusinessSettingsOpen(true)}
                            variant="outline"
                            className="bg-white/5 border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                        >
                            <img src="/icons/business-profile.png" alt="" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 brightness-0 invert" />
                            <span className="hidden xs:inline">Perfil do </span>Negocio
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
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/50 mb-3 sm:mb-4">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{prompt.length.toLocaleString()} caracteres</span>
                        </div>
                        {hasChanges && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
                                <span>Alteracoes nao salvas</span>
                            </div>
                        )}
                    </div>

                    {/* Prompt Textarea */}
                    {prompt || isEditing ? (
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            readOnly={!isEditing}
                            className={`
                                w-full min-h-[40vh] sm:min-h-[60vh] p-4 sm:p-6 rounded-xl sm:rounded-2xl resize-none transition-all
                                bg-white/5 border border-white/10 text-white/90 text-sm leading-relaxed
                                focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                                ${isEditing ? 'bg-white/10 border-purple-500/30' : 'cursor-default'}
                            `}
                            placeholder="Seu prompt aparecera aqui..."
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[60vh] bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 px-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white/30" />
                            </div>
                            <p className="text-white/50 mb-3 sm:mb-4 text-sm sm:text-base text-center">Nenhum prompt configurado</p>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-purple-500 hover:bg-purple-600 text-white text-sm"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Fazer Upload
                            </Button>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[11px] sm:text-xs text-white/40">
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Alteracoes aplicadas automaticamente ao salvar</span>
                    </div>

                    {/* Lia Prompt Editor Chat */}
                    <PromptEditChat
                        currentPrompt={prompt}
                        onPromptUpdate={(newPrompt) => {
                            setPrompt(newPrompt);
                            setIsEditing(true);
                        }}
                    />
                </main>

                {/* Business Settings Modal */}
                <BusinessSettingsModal
                    open={isBusinessSettingsOpen}
                    onClose={() => setIsBusinessSettingsOpen(false)}
                    currentPrompt={prompt}
                    onPromptUpdate={(newPrompt) => {
                        setPrompt(newPrompt);
                        setOriginalPrompt(newPrompt);
                        setHasChanges(false);
                    }}
                />
            </div>
        </Layout>
    );
};

export default MeuPrompt;

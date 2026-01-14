"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Sparkles, Edit3, Upload, Save, RotateCcw, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { promptService } from "@/services/promptService";

interface PromptManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrompt: string | null;
    onPromptUpdate: (newPrompt: string) => void;
}

export default function PromptManager({
    isOpen,
    onClose,
    currentPrompt,
    onPromptUpdate
}: PromptManagerProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editedPrompt, setEditedPrompt] = useState(currentPrompt || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with currentPrompt when it changes
    useEffect(() => {
        if (currentPrompt) {
            setEditedPrompt(currentPrompt);
            setHasChanges(false);
        }
    }, [currentPrompt]);

    // Track changes
    useEffect(() => {
        setHasChanges(editedPrompt !== currentPrompt);
    }, [editedPrompt, currentPrompt]);

    const handleSave = async () => {
        if (!editedPrompt.trim()) {
            toast({
                title: "Prompt vazio",
                description: "O prompt não pode estar vazio.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const result = await promptService.savePrompt(editedPrompt);

            if (result.success) {
                onPromptUpdate(editedPrompt);
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
        setEditedPrompt(currentPrompt || '');
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
                setEditedPrompt(data.text);
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

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Meu Prompt</h2>
                                    <p className="text-xs text-white/50">Gerencie a personalidade do seu agente</p>
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

                        {/* Actions Bar */}
                        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2">
                                {!isEditing ? (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                    >
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Editar
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleRevert}
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                )}

                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Substituir
                                </Button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.pdf,.docx"
                                    className="hidden"
                                />

                                {hasChanges && (
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        size="sm"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
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
                        </div>

                        {/* Prompt Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {currentPrompt || editedPrompt ? (
                                <div className="space-y-4">
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-white/50">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-4 h-4" />
                                            <span>{editedPrompt.length.toLocaleString()} caracteres</span>
                                        </div>
                                        {hasChanges && (
                                            <div className="flex items-center gap-1.5 text-amber-400">
                                                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                <span>Alterações não salvas</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Textarea */}
                                    <textarea
                                        value={editedPrompt}
                                        onChange={(e) => setEditedPrompt(e.target.value)}
                                        readOnly={!isEditing}
                                        className={cn(
                                            "w-full h-[calc(100vh-280px)] p-4 rounded-xl resize-none transition-all",
                                            "bg-white/5 border border-white/10 text-white/90 text-sm leading-relaxed",
                                            "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                                            isEditing ? "bg-white/10 border-purple-500/30" : "cursor-default"
                                        )}
                                        placeholder="Seu prompt aparecerá aqui..."
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
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
                        </div>

                        {/* Footer Info */}
                        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20">
                            <div className="flex items-center gap-2 text-xs text-white/40">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Alterações são aplicadas automaticamente ao seu agente</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

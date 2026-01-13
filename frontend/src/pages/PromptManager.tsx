
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardSidebar from "@/components/DashboardSidebar";
import { motion } from "framer-motion";
import { Save, Upload } from "lucide-react";
import API_CONFIG from "@/config/api";

export default function PromptManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPrompt();
    }, [user]);

    const fetchPrompt = async () => {
        if (!user?.uid) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/agent/prompt/${user.uid}`);
            const data = await response.json();
            if (data.success) {
                setPrompt(data.prompt || "");
            }
        } catch (error) {
            console.error("Error fetching prompt:", error);
            toast({
                title: "Erro ao carregar prompt",
                description: "Não foi possível carregar seu prompt atual.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/agent/prompt/${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (response.ok) {
                toast({
                    title: "Prompt salvo!",
                    description: "As alterações foram salvas com sucesso.",
                    className: "bg-emerald-500 text-white border-0"
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Error saving prompt:", error);
            toast({
                title: "Erro ao salvar",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/agent/upload-prompt`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();

            if (data.success && data.text) {
                setPrompt(data.text);
                toast({
                    title: "Arquivo processado",
                    description: "O texto do arquivo foi inserido no editor. Lembre-se de salvar.",
                });
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "Erro no upload",
                description: "Falha ao processar arquivo. Tente um PDF, DOCX ou TXT.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            // Clear input
            e.target.value = "";
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans">
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNavigate={(page) => {
                    if (page === "my-prompt") return;
                    window.location.href = "/dashboard"; // Simple nav for now
                }}
                currentPage="my-prompt"
                connectedInstances={0} // TODO: make dynamic if needed
            />

            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
                <div className="p-8 max-w-5xl mx-auto space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Meu Prompt</h1>
                            <p className="text-white/60">Visualize e edite as instruções que definem a personalidade do seu agente.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <input
                                    type="file"
                                    id="prompt-upload"
                                    className="hidden"
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    variant="outline"
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                    onClick={() => document.getElementById("prompt-upload")?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <span className="animate-pulse">Processando...</span>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Substituir via Upload
                                        </>
                                    )}
                                </Button>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6"
                            >
                                {isSaving ? (
                                    <>Salving...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/20 border border-white/10 rounded-xl p-1"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                            </div>
                        ) : (
                            <div className="relative">
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[600px] w-full bg-slate-900/50 border-0 text-white font-mono text-sm leading-relaxed p-6 resize-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                                    placeholder="Escreva aqui as instruções do seu agente..."
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-white/30 pointer-events-none">
                                    {prompt.length} caracteres
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessages from "../chat/ChatMessages";
import { AgentMessage } from "@/lib/agent-creator.types";
import Lottie from "lottie-react";
import { useState, useEffect } from "react";

interface LiaChatPanelProps {
    messages: any[]; // ChatState messages
    isTyping: boolean;
    onManualInput: (text: string) => void;
    onSwitchToAgent: () => void;
    onFinish: () => void;
}

export const LiaChatPanel = ({
    messages,
    isTyping,
    onManualInput,
    onSwitchToAgent,
    onFinish
}: LiaChatPanelProps) => {

    const [metaAiData, setMetaAiData] = useState<any>(null);

    useEffect(() => {
        fetch('/lotties/meta-ai-logo.json')
            .then(res => res.json())
            .then(data => setMetaAiData(data))
            .catch(err => console.error("Failed to load Meta AI Lottie:", err));
    }, []);

    const filteredMessages = messages.filter(m => {
        if (m.content.startsWith('[SYSTEM]')) return false;
        // Filter out "Assistente criado..." if there are user messages
        const hasUserInteraction = messages.some(msg => msg.type === 'user');
        if (hasUserInteraction && m.content.includes("Assistente criado! Iniciando modo de teste")) {
            return false;
        }
        return true;
    });

    return (
        <div className="w-full h-[85vh] flex flex-col">
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />

                {/* Toggles Header */}
                <div className="flex justify-center mb-4 bg-black/20 p-1 rounded-xl w-fit mx-auto">
                    <button
                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white shadow-lg"
                    >
                        Falar com Lia
                    </button>
                    <button
                        onClick={onSwitchToAgent}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Testar Assistente
                    </button>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative">
                        {metaAiData ? (
                            <Lottie animationData={metaAiData} loop autoplay style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                                L
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Lia</h3>
                        <p className="text-xs text-white/40">Arquiteta de Assistentes</p>
                    </div>
                </div>

                {/* Chat Messages */}
                <ChatMessages
                    messages={filteredMessages}
                    isTyping={isTyping}
                    alignLeft={true}
                    className="px-0"
                />

                {/* Input Area */}
                <div className="mt-4 flex gap-2">
                    <textarea
                        placeholder="Peça ajustes ao seu assistente (ex: 'Mude o tom para mais formal', 'Adicione informação sobre preços')..."
                        className="flex-1 bg-black/20 border border-white/10 resize-none min-h-[50px] rounded-xl p-3 text-white focus:outline-none focus:border-white/30 transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value) {
                                    onManualInput(value);
                                    e.currentTarget.value = '';
                                }
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-[50px] w-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-500"
                        onClick={(e) => {
                            // Helper to find textarea sibling and submit
                            const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                            if (textarea && textarea.value.trim()) {
                                onManualInput(textarea.value.trim());
                                textarea.value = '';
                            }
                        }}
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Finalizar Teste Button */}
                <Button
                    onClick={onFinish}
                    className="w-full bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 rounded-xl py-3 mt-3 text-sm"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar e Integrar
                </Button>
            </div>
        </div>
    );
};

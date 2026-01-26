import { ArrowRight, Check, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentMessage } from "@/lib/agent-creator.types";

interface AgentTestPanelProps {
    testMessages: AgentMessage[];
    isTestTyping: boolean;
    onTestSend: (message: string) => void;
    onSwitchToLia: () => void;
    onFinish: () => void;
}

export const AgentTestPanel = ({
    testMessages,
    isTestTyping,
    onTestSend,
    onSwitchToLia,
    onFinish
}: AgentTestPanelProps) => {
    return (
        <div className="w-full h-[85vh] flex flex-col">
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50" />

                {/* Toggles Header */}
                <div className="flex justify-center mb-4 bg-black/20 p-1 rounded-xl w-fit mx-auto">
                    <button
                        onClick={onSwitchToLia}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Falar com Lia
                    </button>
                    <button
                        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white shadow-lg"
                    >
                        Testar Assistente
                    </button>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Seu Assistente</h3>
                        <p className="text-xs text-white/40">Ambiente de Teste</p>
                    </div>
                    <div className="ml-auto px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">
                        Teste
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {testMessages.length === 0 && (
                        <div className="text-center text-white/40 py-8">
                            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Envie uma mensagem para testar seu assistente</p>
                        </div>
                    )}
                    {testMessages.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                                msg.type === 'user' ? "bg-purple-600 text-white" : "bg-white/10 text-white"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTestTyping && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
                </div>

                {/* Input Area */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <textarea
                            placeholder="Teste seu assistente..."
                            className="flex-1 bg-black/20 border border-white/10 resize-none min-h-[50px] rounded-xl p-3 text-white focus:outline-none focus:border-white/30 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value) {
                                        onTestSend(value);
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-[50px] w-[50px] rounded-xl bg-purple-600 hover:bg-purple-500"
                            onClick={(e) => {
                                const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                                if (textarea && textarea.value.trim()) {
                                    onTestSend(textarea.value.trim());
                                    textarea.value = '';
                                }
                            }}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>

                    <Button
                        onClick={onFinish}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-2 mt-2"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Finalizar Teste
                    </Button>
                </div>
            </div>
        </div>
    );
};

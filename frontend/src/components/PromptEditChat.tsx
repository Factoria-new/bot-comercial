import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { promptService } from "@/services/promptService";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface PromptEditChatProps {
    currentPrompt: string;
    onPromptUpdate: (newPrompt: string) => void;
}

export const PromptEditChat = ({ currentPrompt, onPromptUpdate }: PromptEditChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Convert simple messages to history format expected by backend
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await promptService.architectChat(
                userMsg.content,
                history,
                currentPrompt
            );

            if (response.success) {
                const botMsg: Message = { role: 'model', content: response.response || "Entendido." };
                setMessages(prev => [...prev, botMsg]);

                if (response.newSystemPrompt) {
                    onPromptUpdate(response.newSystemPrompt);
                    toast({
                        title: "Prompt Atualizado",
                        description: "A Lia aplicou as alterações no seu prompt.",
                        className: "bg-emerald-500 text-white border-0"
                    });
                }
            } else {
                toast({
                    title: "Erro",
                    description: "Não foi possível conectar com a Lia.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao enviar a mensagem.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden mt-6 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-white/5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-white">Editor Assistido pela Lia</h3>
            </div>

            {/* Messages Area - Flattened (limited height) */}
            <div className="h-[200px] overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 text-xs text-center">
                        <Bot className="w-8 h-8 mb-2 opacity-50" />
                        <p>Diga para a Lia como você quer alterar o prompt.<br />Ex: "Deixe o tom mais formal" ou "Adicione perguntas sobre orçamento"</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                        "flex gap-3 text-sm",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-purple-600" : "bg-emerald-600"
                        )}>
                            {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <span className="text-white text-xs font-bold">L</span>}
                        </div>
                        <div className={cn(
                            "px-3 py-2 rounded-2xl max-w-[80%] leading-relaxed",
                            msg.role === 'user'
                                ? "bg-purple-600/20 text-purple-100 rounded-tr-none border border-purple-500/20"
                                : "bg-emerald-600/20 text-emerald-100 rounded-tl-none border border-emerald-500/20"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">L</span>
                        </div>
                        <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none">
                            <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-white/5">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="Digite sua instrução para a Lia..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl w-10 h-10 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

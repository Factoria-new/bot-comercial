"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Loader2,
    Sparkles,
    Store,
    Utensils,
    ShoppingCart,
    Building2,
    Heart,
    GraduationCap,
    Scale,
    Coffee,
    Dumbbell,
    Palette,
    Scissors,
    Menu,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

interface AgentCreatorProps {
    onOpenSidebar?: () => void;
}

const BUSINESS_CATEGORIES = [
    { id: 'barbearia', label: 'Barbearia', icon: Scissors, color: '#3B82F6' },
    { id: 'restaurante', label: 'Restaurante', icon: Utensils, color: '#EF4444' },
    { id: 'loja', label: 'Loja', icon: Store, color: '#10B981' },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, color: '#8B5CF6' },
    { id: 'imobiliaria', label: 'Imobiliária', icon: Building2, color: '#F59E0B' },
    { id: 'consultorio', label: 'Consultório', icon: Heart, color: '#EC4899' },
    { id: 'escola', label: 'Escola', icon: GraduationCap, color: '#06B6D4' },
    { id: 'advocacia', label: 'Advocacia', icon: Scale, color: '#6366F1' },
    { id: 'cafeteria', label: 'Cafeteria', icon: Coffee, color: '#78350F' },
    { id: 'academia', label: 'Academia', icon: Dumbbell, color: '#DC2626' },
    { id: 'design', label: 'Design', icon: Palette, color: '#9333EA' },
];

export default function AgentCreator({ onOpenSidebar }: AgentCreatorProps) {
    const [prompt, setPrompt] = useState("");
    const [step, setStep] = useState<'input' | 'chat'>('input');
    const [testMode, setTestMode] = useState(false); // When true, show full chat with created agent
    const [testMessages, setTestMessages] = useState<Array<{ id: string, type: 'bot' | 'user', content: string }>>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);
    const [introStarted, setIntroStarted] = useState(false); // Controls header fade-out
    const [showHeader, setShowHeader] = useState(true); // Show/hide header with transition
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasAutoStarted = useRef(false);

    // Chat state using onboarding hook
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
    } = useOnboarding();

    // Auto-start: Agent initiates conversation after page load
    useEffect(() => {
        if (hasAutoStarted.current) return;
        if (chatState.messages.length > 0) return; // Already has messages

        hasAutoStarted.current = true;

        // Wait a moment for user to see the header, then transition
        const timer = setTimeout(() => {
            setIntroStarted(true);

            // After fade-out animation, hide header and start chat
            setTimeout(() => {
                setShowHeader(false);
                setStep('chat');
                startOnboarding(); // Agent starts without user input
            }, 600); // Match the CSS transition duration
        }, 1500); // Show header for 1.5s before transition

        return () => clearTimeout(timer);
    }, [startOnboarding, chatState.messages.length]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [prompt]);

    const handleCategoryClick = (categoryId: string) => {
        const templates: Record<string, string> = {
            barbearia: 'Crie um agente para minha barbearia que agende horários, mostre serviços (corte R$35, barba R$25, combo R$50) e aceite Pix',
            restaurante: 'Crie um agente para meu restaurante que apresente o cardápio, faça pedidos, colete endereço para delivery e aceite cartão',
            loja: 'Crie um agente para minha loja que apresente produtos, tire dúvidas, mostre preços e aceite pagamento via Pix',
            ecommerce: 'Crie um agente para meu e-commerce que tire dúvidas sobre produtos, informe sobre frete e direcione para compra no site',
            imobiliaria: 'Crie um agente para minha imobiliária que apresente imóveis disponíveis, agende visitas e capture dados de leads',
            consultorio: 'Crie um agente para meu consultório que informe sobre procedimentos, valores de consulta (R$200) e agende horários',
            escola: 'Crie um agente para minha escola/curso que informe sobre turmas, valores mensais e faça matrículas',
            advocacia: 'Crie um agente para meu escritório de advocacia que tire dúvidas jurídicas básicas e agende consultas',
            cafeteria: 'Crie um agente para minha cafeteria que apresente o menu, faça pedidos e aceite Pix/cartão',
            academia: 'Crie um agente para minha academia que informe planos (mensal R$99, semestral R$89/mês) e agende aulas experimentais',
            design: 'Crie um agente para meu estúdio de design que apresente portfólio, faça orçamentos e agende reuniões',
        };
        setPrompt(templates[categoryId] || '');
        textareaRef.current?.focus();
    };

    const handleSend = async () => {
        if (!prompt.trim() || chatState.isTyping) return;

        if (step === 'chat') {
            // We're in chat mode: send message to the ongoing conversation
            handleUserInput(prompt);
            setPrompt('');
            return;
        }

        // First submission: Trigger Chat Mode, hide header, show chat messages
        setStep('chat');
        startOnboarding(prompt); // Pass the user's initial input to the AI
        setPrompt(''); // Clear the input for future messages
    };

    // Handle sending messages in test mode (separate from interview)
    const handleTestSend = async () => {
        if (!prompt.trim() || isTestTyping) return;

        const userMsg = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'user' as const,
            content: prompt
        };

        setTestMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setIsTestTyping(true);

        try {
            // Call the agent chat API with the created agent's prompt
            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    systemPrompt: chatState.agentConfig?.prompt || ''
                })
            });

            const data = await res.json();

            if (data.success) {
                const botMsg = {
                    id: Math.random().toString(36).substring(2, 9),
                    type: 'bot' as const,
                    content: data.message
                };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const errorMsg = {
                id: Math.random().toString(36).substring(2, 9),
                type: 'bot' as const,
                content: 'Desculpe, tive um problema. Tente novamente.'
            };
            setTestMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTestTyping(false);
        }
    };

    // Main input UI - LIGHT MODE
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
            {/* Menu button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
            >
                <Menu className="w-5 h-5" />
            </Button>

            <div className="w-full max-w-4xl mx-auto">
                {/* Conditional: Show Header OR Chat Messages */}
                {showHeader && step !== 'chat' ? (
                    <div className={cn(
                        "transition-all duration-600 ease-out",
                        introStarted ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"
                    )}>
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">Factoria</span>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold mb-3">
                                <span className="text-gray-900">Seu </span>
                                <span className="text-emerald-600">Vendedor Virtual</span>
                            </h1>
                            <p className="text-gray-500 text-lg">
                                Descreva seu negócio e deixe a IA criar seu agente comercial
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Interview Style: Show ONLY the latest agent message or thinking indicator */
                    <div className="mb-4 flex flex-col items-center justify-center min-h-[200px] animate-in fade-in duration-500">
                        {chatState.isTyping ? (
                            /* Thinking Animation */
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                                <p className="text-gray-500 text-sm animate-pulse">Pensando...</p>
                            </div>
                        ) : (
                            /* Latest Agent Message Only - Simple text, no animation */
                            (() => {
                                const latestBotMessage = [...chatState.messages].reverse().find(m => m.type === 'bot');
                                return latestBotMessage ? (
                                    <div
                                        key={latestBotMessage.id}
                                        className="flex items-center justify-center w-full px-4 animate-in fade-in duration-300"
                                    >
                                        <p className="text-[16pt] sm:text-[20pt] lg:text-[24pt] font-medium text-gray-900 text-center max-w-3xl">
                                            {latestBotMessage.content}
                                        </p>
                                    </div>
                                ) : null;
                            })()
                        )}
                    </div>
                )}

                {/* Conditional: Test Button OR Input Area */}
                {(() => {
                    const latestBotMessage = [...chatState.messages].reverse().find(m => m.type === 'bot');
                    const agentReady = latestBotMessage?.content.includes('testar seu agente');

                    if (agentReady && !testMode) {
                        // Agent Ready - Show Test Button
                        return (
                            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
                                <Button
                                    onClick={() => setTestMode(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/30 gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Testar meu agente
                                </Button>
                            </div>
                        );
                    }

                    if (testMode) {
                        // Test Mode - Full Chat Interface (clean, separate from interview)
                        return (
                            <>
                                {/* Chat Messages */}
                                <div className="mb-4 max-h-[40vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        {testMessages.length === 0 && !isTestTyping && (
                                            <div className="text-center text-gray-500 py-8">
                                                <p>Converse com seu agente criado!</p>
                                                <p className="text-sm mt-2">Faça perguntas como se fosse um cliente.</p>
                                            </div>
                                        )}
                                        {testMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex",
                                                    msg.type === 'user' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[80%] px-4 py-2 rounded-2xl",
                                                        msg.type === 'user'
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-gray-100 text-gray-900"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isTestTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg">
                                    <div className="flex gap-3">
                                        <Textarea
                                            ref={textareaRef}
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Converse com seu agente..."
                                            className={cn(
                                                "flex-1 bg-transparent border-none resize-none text-gray-900 text-lg",
                                                "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                "min-h-[50px] max-h-[150px]"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleTestSend();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleTestSend}
                                            disabled={!prompt.trim() || isTestTyping}
                                            className={cn(
                                                "rounded-full w-12 h-12 p-0 self-end",
                                                prompt.trim()
                                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                    : "bg-gray-200 text-gray-400"
                                            )}
                                        >
                                            {isTestTyping ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    }

                    // Normal Input + Categories
                    return (
                        <>
                            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg mb-6">
                                <div className="flex gap-3">
                                    <Textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={step === 'chat' ? "Digite sua resposta..." : "Como você gostaria de construir seu agente?"}
                                        className={cn(
                                            "flex-1 bg-transparent border-none resize-none text-gray-900 text-lg",
                                            "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                            "min-h-[60px] max-h-[200px]"
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!prompt.trim() || chatState.isTyping}
                                        className={cn(
                                            "rounded-full w-12 h-12 p-0 self-end",
                                            prompt.trim()
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                : "bg-gray-200 text-gray-400"
                                        )}
                                    >
                                        {chatState.isTyping ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Category buttons - only when not in chat mode */}
                            {step !== 'chat' && (
                                <div className="flex flex-wrap justify-center gap-3">
                                    {BUSINESS_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoryClick(cat.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-full",
                                                "bg-white border border-gray-200 hover:border-gray-300 shadow-sm",
                                                "text-gray-700 hover:text-gray-900 transition-all",
                                                "hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                                            <span className="text-sm">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}

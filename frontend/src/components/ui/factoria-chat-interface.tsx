"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ArrowUpIcon,
    Paperclip,
    LogOut,
    Menu,
    RotateCcw,
    Eye,
    EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import ChatMessages from "@/components/chat/ChatMessages";
import IntegrationCards from "@/components/chat/IntegrationCards";

interface AutoResizeProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
    }, [minHeight]);

    return { textareaRef, adjustHeight };
}

interface FactoriaChatInterfaceProps {
    onLogout?: () => void;
    onOpenSidebar?: () => void;
}

export default function FactoriaChatInterface({
    onLogout,
    onOpenSidebar,
}: FactoriaChatInterfaceProps) {
    const [message, setMessage] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 48,
        maxHeight: 150,
    });

    const {
        state,
        isInitialized,
        isOnboardingComplete,
        startOnboarding,
        handleUserInput,
        connectIntegration,
        resetOnboarding,
    } = useOnboarding();

    // Start onboarding when component mounts
    useEffect(() => {
        if (isInitialized && state.messages.length === 0) {
            startOnboarding();
        }
    }, [isInitialized, state.messages.length, startOnboarding]);

    const handleSend = () => {
        if (message.trim() && !state.isTyping) {
            handleUserInput(message.trim());
            setMessage("");
            adjustHeight(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isApiKeyStep = state.step === 'api-key' || (state.step as string) === 'change-api-key';
    const showIntegrations = state.step === 'integrations';
    const isInputDisabled = state.isTyping || state.step === 'generating-agent';

    // Get placeholder based on step
    const getPlaceholder = () => {
        if (isOnboardingComplete) {
            return 'Pergunte algo ou digite "ajuda" para ver comandos...';
        }
        switch (state.step) {
            case 'api-key':
                return 'Cole sua chave de API do Gemini aqui...';
            case 'company-name':
                return 'Digite o nome da sua empresa...';
            case 'company-niche':
                return 'Ex: E-commerce, Saúde, Educação...';
            case 'company-products':
                return 'Ex: Roupas femininas, Cursos online...';
            case 'company-tone':
                return 'Ex: Amigável, Profissional, Casual...';
            default:
                return 'Digite sua mensagem...';
        }
    };

    // Layout changes after onboarding - chat goes to right
    const chatContainerClass = isOnboardingComplete
        ? "max-w-2xl mr-4 lg:mr-8 ml-auto" // Right aligned after onboarding
        : "max-w-3xl mx-auto"; // Centered during onboarding

    return (
        <div
            className="relative w-full h-screen flex flex-col overflow-hidden"
            style={{
                background: `
          radial-gradient(ellipse 80% 50% at 50% 100%, rgba(0, 169, 71, 0.4) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 50% 110%, rgba(25, 177, 89, 0.6) 0%, transparent 50%),
          linear-gradient(to bottom, #0a0a0a 0%, #111111 100%)
        `,
            }}
        >
            {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSidebar}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-3">
                    <img
                        src="/logo-header.png"
                        alt="Factoria"
                        className="h-8 w-auto"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetOnboarding}
                        className="text-white/40 hover:text-white hover:bg-white/10"
                        title="Reiniciar onboarding (teste)"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onLogout}
                        className="text-white/70 hover:text-red-400 hover:bg-white/10"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Chat Messages Area - Right aligned after onboarding */}
            <div className={cn("flex-1 overflow-hidden", isOnboardingComplete && "flex")}>
                {/* Left side placeholder for future content (metrics) */}
                {isOnboardingComplete && (
                    <div className="hidden lg:flex flex-1 items-center justify-center border-r border-emerald-900/20">
                        <div className="text-center text-white/30 p-8">
                            <p className="text-sm">Métricas e análises em breve</p>
                        </div>
                    </div>
                )}

                {/* Chat on the right */}
                <div className={cn("h-full", isOnboardingComplete ? "w-full lg:w-1/2" : "w-full")}>
                    <ChatMessages
                        messages={state.messages}
                        isTyping={state.isTyping}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Integration Cards (when in integrations step only) */}
            {showIntegrations && (
                <div className="flex-shrink-0 px-4 pb-4">
                    <div className="max-w-3xl mx-auto">
                        <IntegrationCards
                            integrations={state.integrations}
                            onConnect={connectIntegration}
                            isConnecting={state.isTyping}
                        />
                    </div>
                </div>
            )}

            {/* Input Box Section - Always show after onboarding, right aligned */}
            {!showIntegrations && (
                <div className={cn("flex-shrink-0 w-full px-4 pb-6", chatContainerClass)}>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-emerald-900/50 shadow-2xl shadow-emerald-900/20">
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={getPlaceholder()}
                                disabled={isInputDisabled}
                                className={cn(
                                    "w-full px-4 py-3 resize-none border-none",
                                    "bg-transparent text-white text-sm sm:text-base",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "placeholder:text-neutral-500 min-h-[48px]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    isApiKeyStep && !showApiKey && "font-mono tracking-wider"
                                )}
                                style={{ overflow: "hidden" }}
                            />

                            {/* Show/Hide API Key toggle */}
                            {isApiKeyStep && message.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-14 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                                >
                                    {showApiKey ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center justify-between p-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/60 hover:text-white hover:bg-white/10"
                                disabled
                            >
                                <Paperclip className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSend}
                                    disabled={!message.trim() || isInputDisabled}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-2 rounded-lg transition-all",
                                        message.trim() && !isInputDisabled
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                                            : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                                    )}
                                >
                                    <ArrowUpIcon className="w-4 h-4" />
                                    <span className="sr-only">Enviar</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle glow effect at bottom */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[30vh] pointer-events-none z-0"
                style={{
                    background: `radial-gradient(ellipse 50% 70% at 50% 100%, rgba(0, 169, 71, 0.15) 0%, transparent 70%)`,
                }}
            />
        </div>
    );
}

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
    GripVertical,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import ChatMessages from "@/components/chat/ChatMessages";
import IntegrationCards from "@/components/chat/IntegrationCards";
import MetricsTable from "@/components/dashboard/MetricsTable";

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

interface CajiChatInterfaceProps {
    onLogout?: () => void;
    onOpenSidebar?: () => void;
    initialMessage?: string;
}

export default function CajiChatInterface({
    onLogout,
    onOpenSidebar,
    initialMessage,
}: CajiChatInterfaceProps) {
    const [message, setMessage] = useState("");
    const [chatWidth, setChatWidth] = useState(50); // Percentage of screen for chat (on right)
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        startTesting,
    } = useOnboarding();

    const hasStartedRef = useRef(false);

    // Start onboarding when component mounts
    useEffect(() => {
        if (!isInitialized) return;

        // If we provided an initial message (from Landing Page), we want to make sure
        // we start a FRESH conversation with that input.
        if (initialMessage && !hasStartedRef.current) {
            if (state.messages.length > 0) {
                // If there's old history, clear it first.
                // This will trigger a re-render with empty messages, allowing the 'else' block to run.
                resetOnboarding();
            } else {
                // Empty state, ready to start with the user's input
                startOnboarding(initialMessage);
                hasStartedRef.current = true;
            }
        }
        // If no initial message, just start normal onboarding if empty
        else if (state.messages.length === 0 && !hasStartedRef.current) {
            startOnboarding();
            hasStartedRef.current = true;
        }
    }, [isInitialized, state.messages.length, startOnboarding, initialMessage, resetOnboarding]);

    // Handle resize
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            // Calculate from right side - chat width is the remaining percentage
            const leftPanelWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            const newChatWidth = 100 - leftPanelWidth;

            // Clamp chat between 30% and 70%
            setChatWidth(Math.min(70, Math.max(30, newChatWidth)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

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

    const showIntegrations = false; // Integrations removed from flow for now
    const isInputDisabled = state.isTyping || state.step === 'generating-agent';

    // Get placeholder based on step
    const getPlaceholder = () => {
        if (state.step === 'testing') {
            return 'O que você gostaria de perguntar ao seu agente?';
        }
        if (state.step === 'interview') {
            return 'Digite sua resposta...';
        }
        if (isOnboardingComplete) {
            return 'Digite "testar" para testar seu agente ou "ajuda"...';
        }
        switch (state.step) {
            case 'company-name':
                return 'Ex: Loja da Maria, Tech Solutions...';
            // Legacy steps kept for fallback
            default:
                return 'Digite sua mensagem...';
        }
    };

    const leftPanelWidth = 100 - chatWidth;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-white"
        >
            {/* Fixed Menu Button - Top Left Corner */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
            >
                <Menu className="w-5 h-5" />
            </Button>

            {/* Left Panel - Metrics Table */}
            {isOnboardingComplete && (
                <div
                    className="h-full flex items-center justify-center bg-gray-50 overflow-y-auto"
                    style={{ width: `${leftPanelWidth}%` }}
                >
                    <MetricsTable />
                </div>
            )}

            {/* Resize Handle */}
            {isOnboardingComplete && (
                <div
                    className={cn(
                        "w-px h-full cursor-col-resize flex items-center justify-center group bg-gray-200",
                        "hover:bg-emerald-400 transition-colors",
                        isResizing && "bg-emerald-500"
                    )}
                    onMouseDown={handleMouseDown}
                >
                    <div className={cn(
                        "absolute w-4 h-12 rounded-full flex items-center justify-center",
                        "bg-gray-200 group-hover:bg-emerald-400 transition-colors border border-gray-300",
                        isResizing && "bg-emerald-500"
                    )}>
                        <GripVertical className="w-3 h-3 text-gray-500" />
                    </div>
                </div>
            )}

            {/* Right Panel - Chat (resizable) */}
            <div
                className="h-full flex flex-col"
                style={{ width: isOnboardingComplete ? `${chatWidth}%` : '100%' }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 z-20 border-b border-gray-200">
                    {/* Spacer for menu button area */}
                    <div className="w-10" />

                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-header.png"
                            alt="Caji"
                            className="h-8 w-auto"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetOnboarding}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title="Reiniciar onboarding (teste)"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onLogout}
                            className="text-gray-600 hover:text-red-500 hover:bg-gray-100"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Chat Messages */}
                {state.step === 'testing' ? (
                    <div className="flex-1 flex flex-col relative">
                        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm font-medium text-center shadow-sm z-10">
                            🧪 Modo de Teste Ativo - Você está falando com seu Agente
                        </div>
                        <ChatMessages
                            messages={state.testMessages}
                            isTyping={state.isTyping}
                            className="flex-1"
                            lightMode
                        />
                    </div>
                ) : (
                    <ChatMessages
                        messages={state.messages}
                        isTyping={state.isTyping}
                        className="flex-1"
                        lightMode
                    />
                )}

                {/* Integration Cards (when in integrations step only) */}
                {showIntegrations && (
                    <div className="flex-shrink-0 px-4 pb-4">
                        <IntegrationCards
                            integrations={state.integrations}
                            onConnect={connectIntegration}
                            isConnecting={state.isTyping}
                            lightMode
                        />
                    </div>
                )}

                {/* Input Box */}
                {!showIntegrations && (
                    <div className="flex-shrink-0 p-4">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg">
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
                                            "w-full px-4 py-3 resize-none border-none rounded-t-xl",
                                            "bg-transparent text-gray-900 text-sm sm:text-base",
                                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                                            "placeholder:text-gray-400 min-h-[48px]",
                                            "disabled:opacity-50 disabled:cursor-not-allowed"
                                        )}
                                        style={{ overflow: "hidden" }}
                                    />
                                </div>

                                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                        disabled
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        onClick={handleSend}
                                        disabled={!message.trim() || isInputDisabled}
                                        className={cn(
                                            "flex items-center gap-1 px-3 py-2 rounded-lg transition-all",
                                            message.trim() && !isInputDisabled
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <ArrowUpIcon className="w-4 h-4" />
                                    </Button>

                                    {isOnboardingComplete && state.step !== 'testing' && (
                                        <Button
                                            onClick={startTesting}
                                            variant="outline"
                                            className="ml-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        >
                                            Testar Agente
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

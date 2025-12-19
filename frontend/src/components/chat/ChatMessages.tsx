"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/onboarding";
import TypingIndicator from "./TypingIndicator";
import { Bot } from "lucide-react";

interface ChatMessagesProps {
    messages: ChatMessage[];
    isTyping: boolean;
    className?: string;
    alignLeft?: boolean;
}

export default function ChatMessages({ messages, isTyping, className, alignLeft }: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Parse markdown-style bold text and newlines
    const parseContent = (content: string) => {
        // First split by newlines
        const lines = content.split('\n');
        return lines.map((line, lineIndex) => {
            const parts = line.split(/(\*\*.*?\*\*)|(_.*?_)/g).filter(Boolean);
            const parsedLine = parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <strong key={index} className="font-semibold text-emerald-300">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                    return (
                        <em key={index} className="italic text-white/60">
                            {part.slice(1, -1)}
                        </em>
                    );
                }
                return part;
            });

            return (
                <span key={lineIndex}>
                    {parsedLine}
                    {lineIndex < lines.length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div
            ref={scrollRef}
            className={cn(
                "flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent",
                className
            )}
        >
            {/* Container - left aligned or centered */}
            <div className={cn(
                "px-4 space-y-4",
                alignLeft ? "max-w-2xl ml-4 lg:ml-8" : "max-w-3xl mx-auto"
            )}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {message.type === 'bot' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}

                        <div
                            className={cn(
                                "max-w-[80%] px-4 py-3 rounded-2xl text-sm sm:text-base",
                                message.type === 'user'
                                    ? "bg-emerald-600 text-white rounded-br-md"
                                    : "bg-neutral-800/50 text-neutral-100 rounded-bl-md"
                            )}
                        >
                            {parseContent(message.content)}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <TypingIndicator />
                    </div>
                )}
            </div>
        </div>
    );
}

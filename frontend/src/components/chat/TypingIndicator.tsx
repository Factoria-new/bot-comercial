"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
    className?: string;
}

export default function TypingIndicator({ className }: TypingIndicatorProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 px-4 py-3 bg-neutral-800/50 rounded-2xl rounded-bl-md w-fit",
                className
            )}
        >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );
}

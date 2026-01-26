"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
    className?: string;
    lightMode?: boolean;
}

export default function TypingIndicator({ className, lightMode }: TypingIndicatorProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-md w-fit",
                lightMode ? "bg-gray-100 border border-gray-200" : "bg-neutral-800/50",
                className
            )}
        >
            <span
                className={cn("w-2 h-2 rounded-full animate-bounce", lightMode ? "bg-emerald-500" : "bg-emerald-400")}
                style={{ animationDelay: '0ms' }}
            />
            <span
                className={cn("w-2 h-2 rounded-full animate-bounce", lightMode ? "bg-emerald-500" : "bg-emerald-400")}
                style={{ animationDelay: '150ms' }}
            />
            <span
                className={cn("w-2 h-2 rounded-full animate-bounce", lightMode ? "bg-emerald-500" : "bg-emerald-400")}
                style={{ animationDelay: '300ms' }}
            />
        </div>
    );
}

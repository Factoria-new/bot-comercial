"use client";

import { cn } from "@/lib/utils";
import { Integration } from "@/types/onboarding";
import { Check } from "lucide-react";
import { BrandIcons } from "@/components/ui/brand-icons";

interface IntegrationCardsProps {
    integrations: Integration[];
    onConnect: (id: string) => void;
    isConnecting?: boolean;
    className?: string;
    compact?: boolean;
    lightMode?: boolean;
}

export default function IntegrationCards({
    integrations,
    onConnect,
    isConnecting,
    className,
    compact = false,
    lightMode = false,
}: IntegrationCardsProps) {
    if (compact) {
        return (
            <div className={cn("space-y-2", className)}>
                {integrations.map((integration) => {
                    const Icon = BrandIcons[integration.icon];
                    return (
                        <div
                            key={integration.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                integration.connected
                                    ? lightMode ? "bg-emerald-50 border border-emerald-200" : "bg-emerald-900/30 border border-emerald-700/50"
                                    : lightMode ? "bg-gray-50 border border-gray-200" : "bg-neutral-800/30 border border-neutral-700/50"
                            )}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: integration.color }}
                            >
                                {Icon && <Icon className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium truncate", lightMode ? "text-gray-900" : "text-white")}>
                                    {integration.name}
                                </p>
                                {integration.connected && integration.username && (
                                    <p className={cn("text-xs truncate", lightMode ? "text-gray-500" : "text-neutral-400")}>
                                        {integration.username}
                                    </p>
                                )}
                            </div>
                            {integration.connected && (
                                <Check className="w-4 h-4 text-emerald-500" />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Full cards view for onboarding
    return (
        <div className={cn("flex flex-wrap justify-center gap-3 p-4", className)}>
            {integrations.map((integration) => {
                const Icon = BrandIcons[integration.icon];
                return (
                    <button
                        key={integration.id}
                        onClick={() => !integration.connected && onConnect(integration.id)}
                        disabled={integration.connected || isConnecting}
                        className={cn(
                            "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                            "border",
                            integration.connected
                                ? lightMode ? "bg-emerald-50 border-emerald-300 cursor-default" : "bg-neutral-800 border-emerald-600 cursor-default"
                                : lightMode
                                    ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer shadow-sm"
                                    : "bg-neutral-900 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 cursor-pointer",
                            isConnecting && "opacity-50 cursor-wait"
                        )}
                        style={{ minWidth: '100px' }}
                    >
                        {integration.connected && (
                            <div className="absolute -top-1 -right-1">
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        )}

                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: integration.color }}
                        >
                            {Icon && <Icon className="w-5 h-5 text-white" />}
                        </div>

                        <p className={cn("text-xs font-medium text-center", lightMode ? "text-gray-900" : "text-white")}>
                            {integration.name}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}

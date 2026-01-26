"use client";

import { cn } from "@/lib/utils";
import { Integration } from "@/types/onboarding";
import IntegrationCards from "@/components/chat/IntegrationCards";
import { Check, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";

interface IntegrationsPanelProps {
    integrations: Integration[];
    onDisconnect?: (id: string) => void;
    className?: string;
}

export default function IntegrationsPanel({
    integrations,
    onDisconnect,
    className,
}: IntegrationsPanelProps) {
    const { isConnected } = useSocket();
    const connectedIntegrations = integrations.filter(i => i.connected);
    const pendingIntegrations = integrations.filter(i => !i.connected);

    return (
        <div
            className={cn(
                "h-full bg-neutral-900/95 backdrop-blur-xl border-r border-emerald-900/30",
                "flex flex-col overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">Integrações</h2>
                        <p className="text-xs text-white/50">
                            {connectedIntegrations.length} conectada(s)
                        </p>
                    </div>
                </div>
            </div>

            {/* Connected Integrations */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {connectedIntegrations.length > 0 && (
                    <div>
                        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                            Conectadas
                        </h3>
                        <IntegrationCards
                            integrations={connectedIntegrations}
                            onConnect={() => { }}
                            compact
                        />
                    </div>
                )}

                {pendingIntegrations.length > 0 && (
                    <div>
                        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                            Disponíveis
                        </h3>
                        <div className="space-y-2">
                            {pendingIntegrations.map((integration) => (
                                <div
                                    key={integration.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/20 border border-neutral-700/30 opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                                        <WifiOff className="w-4 h-4 text-neutral-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-neutral-400">{integration.name}</p>
                                        <p className="text-xs text-neutral-500">Não conectado</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="flex-shrink-0 p-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs">
                    <div
                        className={cn(
                            "w-2 h-2 rounded-full",
                            isConnected ? "bg-emerald-500" : "bg-red-500"
                        )}
                    />
                    <span className="text-white/50">
                        Servidor {isConnected ? "Online" : "Offline"}
                    </span>
                </div>
            </div>
        </div>
    );
}

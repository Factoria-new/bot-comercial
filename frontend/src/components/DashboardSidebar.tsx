"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    X,
    MessageSquare,
    Bot,
    Calendar,
    Settings,
    ChevronRight,
    ChevronDown,
    Wifi,
    Link2,
    Check,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { Integration } from "@/types/onboarding";

// Brand icons (simplified)
const BrandIcons: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
    whatsapp: ({ className, style }) => (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    ),
    instagram: ({ className, style }) => (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    ),
    tiktok: ({ className, style }) => (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    ),
    facebook: ({ className, style }) => (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    twitter: ({ className, style }) => (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
};

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings") => void;
    currentPage: string;
    connectedInstances?: number;
    totalInstances?: number;
    integrations?: Integration[];
}

export default function DashboardSidebar({
    isOpen,
    onClose,
    onNavigate,
    currentPage,
    connectedInstances = 0,
    totalInstances = 0,
    integrations = [],
}: DashboardSidebarProps) {
    const { isConnected } = useSocket();
    const { user } = useAuth();
    const [integrationsExpanded, setIntegrationsExpanded] = useState(false);

    const connectedIntegrations = integrations.filter(i => i.connected).length;

    const menuItems = [
        {
            id: "chat",
            label: "Chat",
            icon: MessageSquare,
            description: "Tela inicial",
        },
        {
            id: "connections",
            label: "Conexões WhatsApp",
            icon: Wifi,
            description: `${connectedInstances}/${totalInstances} ativas`,
            badge: totalInstances > 0 ? `${connectedInstances}/${totalInstances}` : undefined,
        },
        {
            id: "ai-status",
            label: "Status da IA",
            icon: Bot,
            description: "Configurar assistente",
        },
        {
            id: "calendar",
            label: "Calendário",
            icon: Calendar,
            description: "Integração Google",
        },
        {
            id: "settings",
            label: "Configurações",
            icon: Settings,
            description: "Preferências",
        },
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-neutral-900/95 backdrop-blur-xl z-50",
                    "border-r border-emerald-900/30 shadow-2xl shadow-black/50",
                    "transform transition-transform duration-300 ease-out",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-header.png"
                            alt="Factoria"
                            className="h-8 w-auto"
                        />
                        <div>
                            <h2 className="text-white font-semibold text-sm">Factoria</h2>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        isConnected ? "bg-emerald-500" : "bg-red-500"
                                    )}
                                />
                                <span className="text-xs text-white/50">
                                    {isConnected ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="flex-shrink-0 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.email}
                            </p>
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    user?.role === "pro" || user?.role === "admin"
                                        ? "text-emerald-400 bg-emerald-400/10"
                                        : "text-neutral-400 bg-neutral-400/10"
                                )}
                            >
                                {user?.role === "pro" || user?.role === "admin" ? "PRO" : "BÁSICO"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Menu Items - Scrollable */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* Regular menu items */}
                    {menuItems.slice(0, 1).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/5",
                                currentPage === item.id
                                    ? "bg-emerald-600/20 text-emerald-400"
                                    : "text-white/70 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-white/40">{item.description}</p>
                            </div>
                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-400" : "text-white/30"
                                )}
                            />
                        </button>
                    ))}

                    {/* Integrations - Expandable */}
                    <div>
                        <button
                            onClick={() => setIntegrationsExpanded(!integrationsExpanded)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/5",
                                integrationsExpanded
                                    ? "bg-emerald-600/20 text-emerald-400"
                                    : "text-white/70 hover:text-white"
                            )}
                        >
                            <Link2
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    integrationsExpanded
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">Integrações</p>
                                <p className="text-xs text-white/40">{connectedIntegrations} conectada(s)</p>
                            </div>
                            {connectedIntegrations > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400">
                                    {connectedIntegrations}
                                </span>
                            )}
                            {integrationsExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50" />
                            )}
                        </button>

                        {/* Expanded Integrations List */}
                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-300",
                                integrationsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}
                        >
                            <div className="pl-4 pr-2 py-2 space-y-1">
                                {integrations.map((integration) => {
                                    const Icon = BrandIcons[integration.icon];
                                    return (
                                        <div
                                            key={integration.id}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg",
                                                "bg-white/5 border",
                                                integration.connected
                                                    ? "border-emerald-700/50"
                                                    : "border-transparent"
                                            )}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: integration.color }}
                                            >
                                                {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white truncate">
                                                    {integration.name}
                                                </p>
                                                <p className="text-[10px] text-white/40">
                                                    {integration.connected ? "Conectado" : "Não conectado"}
                                                </p>
                                            </div>
                                            {integration.connected && (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Rest of menu items */}
                    {menuItems.slice(1).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                                "group hover:bg-white/5",
                                currentPage === item.id
                                    ? "bg-emerald-600/20 text-emerald-400"
                                    : "text-white/70 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-400"
                                        : "text-white/50 group-hover:text-white/80"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-white/40">{item.description}</p>
                            </div>
                            {item.badge && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400">
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-400" : "text-white/30"
                                )}
                            />
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-white/10">
                    <p className="text-xs text-white/30 text-center">
                        © {new Date().getFullYear()} Factoria Assistant
                    </p>
                </div>
            </div>
        </>
    );
}

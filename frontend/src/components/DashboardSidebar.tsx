"use client";

import { useState, useEffect } from "react";
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
    LogOut,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { Integration } from "@/types/onboarding";
import { BrandIcons } from "@/components/ui/brand-icons";

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings") => void;
    currentPage: string;
    connectedInstances?: number;
    totalInstances?: number;
    integrations?: Integration[];
    onLogout?: () => void;
    forceExpandIntegrations?: boolean;
    onIntegrationClick?: (id: string) => void;
    onIntegrationDisconnect?: (id: string) => void;
}

export default function DashboardSidebar({
    isOpen,
    onClose,
    onNavigate,
    currentPage,
    connectedInstances = 0,
    totalInstances = 0,
    integrations = [],
    onLogout,
    forceExpandIntegrations = false,
    onIntegrationClick,
    onIntegrationDisconnect,
}: DashboardSidebarProps) {
    const { isConnected } = useSocket();
    const { user } = useAuth();
    const [integrationsExpanded, setIntegrationsExpanded] = useState(false);
    const [liveIntegrations, setLiveIntegrations] = useState<Integration[]>(integrations);

    // Update liveIntegrations when prop changes
    useEffect(() => {
        setLiveIntegrations(integrations);
    }, [integrations]);

    // Fetch live Instagram status when sidebar opens
    useEffect(() => {
        if (!isOpen || !user?.email) return;

        const fetchInstagramStatus = async () => {
            try {
                const res = await fetch(`/api/instagram/status?userId=${encodeURIComponent(user.email!)}`);
                const data = await res.json();

                // Update the Instagram integration status based on live data
                setLiveIntegrations(prev => prev.map(integration =>
                    integration.id === 'instagram'
                        ? { ...integration, connected: data.isConnected || false }
                        : integration
                ));
            } catch (error) {
                console.error('Failed to fetch Instagram status:', error);
            }
        };

        fetchInstagramStatus();
    }, [isOpen, user?.email]);

    // Effect to handle forced expansion with delay
    useEffect(() => {
        if (forceExpandIntegrations && isOpen) {
            const timer = setTimeout(() => {
                setIntegrationsExpanded(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [forceExpandIntegrations, isOpen]);

    const connectedIntegrations = liveIntegrations.filter(i => i.connected).length;

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
                    "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar - Light Mode */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50",
                    "border-r border-gray-200 shadow-xl",
                    "transform transition-transform duration-300 ease-out",
                    "flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-header.png"
                            alt="Factoria"
                            className="h-8 w-auto"
                        />
                        <div>
                            <h2 className="text-gray-900 font-semibold text-sm">Factoria</h2>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        isConnected ? "bg-emerald-500" : "bg-red-500"
                                    )}
                                />
                                <span className="text-xs text-gray-500">
                                    {isConnected ? "Online" : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-900 text-sm font-medium truncate">
                                {user?.email}
                            </p>
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    user?.role === "pro" || user?.role === "admin"
                                        ? "text-emerald-600 bg-emerald-100"
                                        : "text-gray-500 bg-gray-200"
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
                                "group hover:bg-gray-100",
                                currentPage === item.id
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-600"
                                        : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-500" : "text-gray-300"
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
                                "group hover:bg-gray-100",
                                integrationsExpanded
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            <Link2
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    integrationsExpanded
                                        ? "text-emerald-600"
                                        : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">Integrações</p>
                                <p className="text-xs text-gray-400">{connectedIntegrations} conectada(s)</p>
                            </div>
                            {connectedIntegrations > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                                    {connectedIntegrations}
                                </span>
                            )}
                            {integrationsExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
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
                                {liveIntegrations.map((integration) => {
                                    const Icon = BrandIcons[integration.icon];
                                    return (
                                        <div
                                            key={integration.id}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                                "bg-gray-50 border",
                                                integration.connected
                                                    ? "border-emerald-200"
                                                    : "border-transparent"
                                            )}
                                        >
                                            <button
                                                onClick={() => !integration.connected && onIntegrationClick?.(integration.id)}
                                                className="flex-1 flex items-center gap-3 text-left w-full min-w-0"
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: integration.color }}
                                                >
                                                    {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 truncate">
                                                        {integration.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {integration.connected ? "Conectado" : "Conectar"}
                                                    </p>
                                                </div>
                                            </button>

                                            {integration.connected ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onIntegrationDisconnect?.(integration.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors group/disconnect"
                                                    title="Desconectar"
                                                >
                                                    <LogOut className="w-4 h-4 text-red-400 group-hover/disconnect:text-red-500" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onIntegrationClick?.(integration.id)}
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500" />
                                                </button>
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
                                "group hover:bg-gray-100",
                                currentPage === item.id
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-gray-700 hover:text-gray-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    currentPage === item.id
                                        ? "text-emerald-600"
                                        : "text-gray-400 group-hover:text-gray-600"
                                )}
                            />
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                            {item.badge && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                                    {item.badge}
                                </span>
                            )}
                            <ChevronRight
                                className={cn(
                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                    currentPage === item.id ? "text-emerald-500" : "text-gray-300"
                                )}
                            />
                        </button>
                    ))}
                </nav>

                {/* Footer with Logout */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                    {onLogout && (
                        <button
                            onClick={() => {
                                onLogout();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-600 hover:bg-red-50 hover:text-red-700 group"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sair da conta</span>
                        </button>
                    )}
                    <p className="text-xs text-gray-400 text-center">
                        © {new Date().getFullYear()} Factoria Assistant
                    </p>
                </div>
            </div>
        </>
    );
}

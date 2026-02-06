import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Integration } from '@/types/onboarding';

interface IntegrationsContextType {
    integrations: Integration[];
    isWhatsAppConnected: boolean;
    isGoogleCalendarConnected: boolean;
    whatsappModalState: any;
    closeWhatsappModal: () => void;
    handleGenerateQR: (instanceId: number) => void;
    handleWhatsappDisconnect: () => void;
    whatsappInstance: any;
    currentSessionId: string;
    handleIntegrationClick: (id: string) => void;
    handleIntegrationDisconnect: (id: string) => void;
    refreshCalendarStatus: () => Promise<void>;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export const IntegrationsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    // WhatsApp Integration
    const {
        instances: whatsappInstances,
        handleGenerateQR,
        modalState: whatsappModalState,
        closeModal: closeWhatsappModal,
        handleDisconnect: handleWhatsappDisconnect
    } = useWhatsAppInstances();

    const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;
    const currentSessionId = String(whatsappInstances[0]?.id || '1');

    // Google Calendar Integration
    const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

    const googleCalendarUserId = user?.email || localStorage.getItem('userEmail') || 'default-user';

    const checkGoogleCalendarStatus = useCallback(async () => {
        if (!googleCalendarUserId) return;
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/google-calendar/status?userId=${encodeURIComponent(googleCalendarUserId)}`);
            const data = await response.json();
            if (data.success && data.isConnected) {
                setIsGoogleCalendarConnected(true);
            } else {
                setIsGoogleCalendarConnected(false);
            }
        } catch (e) {
            console.error("Failed to check Google Calendar status", e);
        }
    }, [googleCalendarUserId]);

    useEffect(() => {
        checkGoogleCalendarStatus();
    }, [checkGoogleCalendarStatus]);

    const handleGoogleCalendarConnect = async () => {
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/google-calendar/auth-url?userId=${encodeURIComponent(googleCalendarUserId)}`);
            const data = await response.json();

            if (data.success && data.authUrl) {
                const popup = window.open(
                    data.authUrl,
                    'Google Calendar Auth',
                    'width=600,height=700,scrollbars=yes'
                );

                const checkPopup = setInterval(async () => {
                    if (popup?.closed) {
                        clearInterval(checkPopup);

                        // If popup closed and we are NOT connected, trigger cleanup
                        if (!isGoogleCalendarConnected) {
                            console.log("Popup closed without connection. Cleaning up INITIATED state...");
                            handleGoogleCalendarDisconnect();
                        }
                        return;
                    }

                    try {
                        const statusRes = await fetch(`${backendUrl}/api/google-calendar/status?userId=${encodeURIComponent(googleCalendarUserId)}`);
                        const statusData = await statusRes.json();

                        if (statusData.success && statusData.isConnected) {
                            setIsGoogleCalendarConnected(true);
                            popup?.close();
                            clearInterval(checkPopup);
                            toast({
                                title: "Google Calendar Conectado!",
                                description: "Integração realizada com sucesso.",
                                className: "bg-emerald-500 text-white border-0"
                            });
                        }
                    } catch (e) { /* ignore */ }
                }, 2000);
            }
        } catch (error) {
            console.error('Google Calendar auth error:', error);
            toast({
                title: "Erro",
                description: "Não foi possível conectar ao Google Calendar.",
                variant: "destructive"
            });
        }
    };

    const handleGoogleCalendarDisconnect = async () => {
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/google-calendar/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: googleCalendarUserId })
            });
            const data = await response.json();

            if (data.success) {
                setIsGoogleCalendarConnected(false);
                toast({
                    title: "Desconectado",
                    description: "Google Calendar desconectado com sucesso.",
                });
            }
        } catch (error) {
            console.error('Failed to disconnect Google Calendar:', error);
            toast({
                title: "Erro",
                description: "Não foi possível desconectar o Google Calendar.",
                variant: "destructive"
            });
        }
    };

    // Instagram Integration
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);

    const checkInstagramStatus = useCallback(async () => {
        if (!user?.email) return;
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/instagram/status?userId=${encodeURIComponent(user.email)}`);
            const data = await response.json();
            if (data.success && data.isConnected) {
                setIsInstagramConnected(true);

                // Ensure polling is active
                fetch(`${backendUrl}/api/instagram/start-polling`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.email })
                }).catch(err => console.error('Failed to ensure polling:', err));
            } else {
                setIsInstagramConnected(false);
            }
        } catch (e) {
            console.error("Failed to check Instagram status", e);
        }
    }, [user?.email]);

    useEffect(() => {
        checkInstagramStatus();

        // Listen for message from callback window
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected' && event.data?.success) {
                setIsInstagramConnected(true);
                toast({
                    title: "Instagram Conectado!",
                    description: `Conectado como @${event.data.username || 'usuário'}`,
                    className: "bg-emerald-500 text-white border-0"
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [checkInstagramStatus, toast]);

    const handleInstagramConnect = async () => {
        if (!user?.email) return;
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/instagram/auth-url?userId=${encodeURIComponent(user.email)}`);
            const data = await response.json();

            if (data.success && data.authUrl) {
                const popup = window.open(
                    data.authUrl,
                    'Instagram Auth',
                    'width=600,height=700,scrollbars=yes'
                );

                const checkPopup = setInterval(async () => {
                    if (popup?.closed) {
                        clearInterval(checkPopup);

                        // Check status one more time
                        const statusRes = await fetch(`${backendUrl}/api/instagram/status?userId=${encodeURIComponent(user.email)}`);
                        const statusData = await statusRes.json();

                        // If popup closed and we are NOT connected, trigger cleanup
                        if (!statusData.success || !statusData.isConnected) {
                            console.log("Instagram popup closed without connection. Cleaning up INITIATED state...");
                            handleInstagramDisconnect();
                        } else {
                            setIsInstagramConnected(true);
                        }
                        return;
                    }

                    // Poll for connection success while window is open
                    // This is needed because sometimes the redirect back doesn't happen automatically
                    try {
                        const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
                        const response = await fetch(`${backendUrl}/api/instagram/status?userId=${encodeURIComponent(user.email)}`);
                        const data = await response.json();

                        if (data.success && data.isConnected) {
                            popup.close();
                            clearInterval(checkPopup);
                            setIsInstagramConnected(true);

                            // Start polling immediately
                            try {
                                await fetch(`${backendUrl}/api/instagram/start-polling`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: user.email })
                                });
                            } catch (e) {
                                console.error('Failed to start polling:', e);
                            }

                            toast({
                                title: "Instagram Conectado!",
                                description: "Conexão estabelecida com sucesso.",
                                className: "bg-emerald-500 text-white border-0"
                            });
                        }
                    } catch (e) {
                        // Ignore errors during polling
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Instagram auth error:', error);
            toast({
                title: "Erro",
                description: "Não foi possível conectar ao Instagram.",
                variant: "destructive"
            });
        }
    };

    const handleInstagramDisconnect = async () => {
        if (!user?.email) return;
        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/instagram/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.email })
            });
            const data = await response.json();

            if (data.success) {
                setIsInstagramConnected(false);
                toast({
                    title: "Desconectado",
                    description: "Instagram desconectado com sucesso.",
                });
            }
        } catch (error) {
            console.error('Failed to disconnect Instagram:', error);
            toast({
                title: "Erro",
                description: "Não foi possível desconectar o Instagram.",
                variant: "destructive"
            });
        }
    };

    const integrations: Integration[] = [
        { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
        { id: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: 'google_calendar', connected: isGoogleCalendarConnected },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', connected: isInstagramConnected },
        { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'facebook', connected: false, isComingSoon: true },
    ];

    const handleIntegrationClick = (id: string) => {
        if (id === 'whatsapp') {
            if (!isWhatsAppConnected) {
                handleGenerateQR(1);
            }
        } else if (id === 'google_calendar') {
            if (!isGoogleCalendarConnected) {
                handleGoogleCalendarConnect();
            }
        } else if (id === 'instagram') {
            if (!isInstagramConnected) {
                handleInstagramConnect();
            }
        }
    };

    const handleIntegrationDisconnect = (id: string) => {
        if (id === 'whatsapp') {
            handleWhatsappDisconnect();
        } else if (id === 'google_calendar') {
            handleGoogleCalendarDisconnect();
        } else if (id === 'instagram') {
            handleInstagramDisconnect();
        }
    };

    return (
        <IntegrationsContext.Provider value={{
            integrations,
            isWhatsAppConnected,
            isGoogleCalendarConnected,
            whatsappModalState,
            closeWhatsappModal,
            handleGenerateQR,
            handleWhatsappDisconnect,
            whatsappInstance: whatsappInstances[0],
            currentSessionId,
            handleIntegrationClick,
            handleIntegrationDisconnect,
            refreshCalendarStatus: checkGoogleCalendarStatus
        }}>
            {children}
        </IntegrationsContext.Provider>
    );
};

export const useIntegrationsContext = () => {
    const context = useContext(IntegrationsContext);
    if (context === undefined) {
        throw new Error('useIntegrationsContext must be used within an IntegrationsProvider');
    }
    return context;
};

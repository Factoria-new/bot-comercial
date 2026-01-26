import { useState, useEffect } from 'react';
import { useWhatsAppInstances } from './useWhatsAppInstances';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Integration } from '@/types/onboarding';

export const useIntegrations = () => {
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

    const checkGoogleCalendarStatus = async () => {
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
    };

    useEffect(() => {
        checkGoogleCalendarStatus();
    }, [googleCalendarUserId]);

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

    const integrations: Integration[] = [
        { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
        { id: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: 'google_calendar', connected: isGoogleCalendarConnected },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', connected: false, isComingSoon: true },
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
        }
    };

    const handleIntegrationDisconnect = (id: string) => {
        if (id === 'whatsapp') {
            handleWhatsappDisconnect();
        } else if (id === 'google_calendar') {
            handleGoogleCalendarDisconnect();
        }
    };

    return {
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
    };
};

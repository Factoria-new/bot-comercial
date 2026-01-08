/**
 * useCalendarConnection Hook
 * 
 * Centralizes Google Calendar OAuth connection logic.
 * Previously duplicated in CalendarIntegration.tsx and AgentConfigModal.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import API_CONFIG from '@/config/api';
import { CalendarSettings } from '@/lib/scheduleTypes';

interface UseCalendarConnectionOptions {
    /** Session ID for calendar connection (e.g., 'instance_123' or 'user_xxx') */
    sessionId: string;
    /** User email for multi-tenant identification */
    userEmail?: string;
    /** Whether to check status on mount */
    autoCheck?: boolean;
    /** Callback when connection is successful */
    onConnected?: () => void;
    /** Callback when disconnection is successful */
    onDisconnected?: () => void;
}

interface UseCalendarConnectionReturn {
    /** Whether calendar is connected */
    isConnected: boolean;
    /** Whether checking connection status */
    isLoading: boolean;
    /** Whether OAuth flow is in progress */
    isConnecting: boolean;
    /** Saved calendar settings from the server */
    savedSettings: CalendarSettings | null;
    /** Initiate connection (opens settings modal flow) */
    connect: (settings: CalendarSettings) => Promise<void>;
    /** Disconnect calendar */
    disconnect: () => Promise<void>;
    /** Manually check connection status */
    checkStatus: (connectionId?: string) => Promise<void>;
}

export const useCalendarConnection = ({
    sessionId,
    userEmail,
    autoCheck = true,
    onConnected,
    onDisconnected
}: UseCalendarConnectionOptions): UseCalendarConnectionReturn => {
    const { authenticatedFetch } = useAuthenticatedFetch();
    const { toast } = useToast();

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [savedSettings, setSavedSettings] = useState<CalendarSettings | null>(null);

    /**
     * Check the current connection status with the backend
     */
    const checkStatus = useCallback(async (connectionId?: string) => {
        if (!sessionId) return;

        setIsLoading(true);
        try {
            let url = `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}`;
            const params = new URLSearchParams();

            if (connectionId) params.append('connectionId', connectionId);
            if (userEmail) params.append('userId', userEmail);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await authenticatedFetch(url);
            const data = await response.json();

            setIsConnected(data.connected || false);
            if (data.settings) {
                setSavedSettings(data.settings);
            }

            if (data.connected && isConnecting) {
                setIsConnecting(false);
            }
        } catch (error) {
            console.error('Erro ao verificar status do Calendar:', error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, userEmail, authenticatedFetch, isConnecting]);

    /**
     * Initiate the OAuth connection flow
     */
    const connect = useCallback(async (settings: CalendarSettings) => {
        if (!sessionId) return;

        setIsConnecting(true);

        try {
            const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/calendar/connect`, {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    userId: userEmail,
                    settings
                }),
            });

            const data = await response.json();

            // Already connected case
            if (data.alreadyConnected) {
                setIsConnected(true);
                setIsConnecting(false);
                setSavedSettings(settings);
                toast({
                    title: "Conexão Reativada",
                    description: "Sua conta do Google Calendar foi reativada com sucesso.",
                });
                await checkStatus(data.connectionId);
                onConnected?.();
                return;
            }

            // OAuth flow case
            if (data.authUrl && data.connectionId) {
                // Open OAuth popup
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const authWindow = window.open(
                    data.authUrl,
                    'Connect Google Calendar',
                    `width=${width},height=${height},top=${top},left=${left}`
                );

                // Polling to check connection status
                const startTime = Date.now();
                const TIMEOUT_MS = 300000; // 5 minutes
                const POLL_INTERVAL_MS = 2000;

                const checkInterval = setInterval(async () => {
                    // Timeout check
                    if (Date.now() - startTime > TIMEOUT_MS) {
                        clearInterval(checkInterval);
                        setIsConnecting(false);
                        toast({
                            title: "Timeout",
                            description: "Conexão expirou. Tente novamente.",
                            variant: "destructive"
                        });
                        return;
                    }

                    // Check if window is closed
                    let isWindowClosed = false;
                    try {
                        isWindowClosed = !!authWindow?.closed;
                    } catch (e) {
                        // Ignore Cross-Origin errors
                    }

                    if (isWindowClosed) {
                        clearInterval(checkInterval);
                        await checkStatus(data.connectionId);
                        setIsConnecting(false);
                    } else {
                        // Poll backend for status
                        try {
                            let statusUrl = `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}?connectionId=${data.connectionId}`;
                            if (userEmail) statusUrl += `&userId=${userEmail}`;

                            const statusResponse = await authenticatedFetch(statusUrl);
                            const statusData = await statusResponse.json();

                            if (statusData.connected) {
                                clearInterval(checkInterval);
                                try { authWindow?.close(); } catch (e) { }

                                setIsConnected(true);
                                setIsConnecting(false);
                                setSavedSettings(settings);

                                toast({
                                    title: "Conectado!",
                                    description: "Google Calendar conectado com sucesso.",
                                });

                                onConnected?.();
                            }
                        } catch (e) {
                            // Ignore temporary network errors during polling
                        }
                    }
                }, POLL_INTERVAL_MS);
            } else {
                throw new Error('URL de autenticação não recebida');
            }
        } catch (error) {
            console.error('Erro ao conectar Calendar:', error);
            setIsConnecting(false);
            toast({
                title: "Erro",
                description: "Falha ao iniciar conexão. Verifique o backend.",
                variant: "destructive"
            });
        }
    }, [sessionId, userEmail, authenticatedFetch, toast, checkStatus, onConnected]);

    /**
     * Disconnect the calendar
     */
    const disconnect = useCallback(async () => {
        if (!sessionId) return;

        try {
            let disconnectUrl = `${API_CONFIG.BASE_URL}/api/calendar/disconnect/${sessionId}`;
            if (userEmail) disconnectUrl += `?userId=${userEmail}`;

            const response = await authenticatedFetch(disconnectUrl, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Falha ao desconectar');
            }

            setIsConnected(false);
            setSavedSettings(null);

            toast({
                title: "Desconectado",
                description: "Google Calendar desconectado com sucesso.",
            });

            onDisconnected?.();
        } catch (error) {
            console.error('Erro ao desconectar Calendar:', error);
            toast({
                title: "Erro",
                description: "Não foi possível desconectar o Google Calendar.",
                variant: "destructive"
            });
        }
    }, [sessionId, userEmail, authenticatedFetch, toast, onDisconnected]);

    // Check status on mount if autoCheck is enabled
    useEffect(() => {
        if (autoCheck && sessionId) {
            checkStatus();
        }
    }, [autoCheck, sessionId, checkStatus]);

    // Handle URL callback parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const calendarParam = urlParams.get('calendar');

        if (calendarParam === 'connected') {
            toast({
                title: "Google Calendar Conectado!",
                description: "Sua conta foi conectada com sucesso.",
            });
            window.history.replaceState({}, '', window.location.pathname);
            checkStatus();
        } else if (calendarParam === 'error') {
            toast({
                title: "Erro na Conexão",
                description: "Não foi possível conectar ao Google Calendar. Tente novamente.",
                variant: "destructive"
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    return {
        isConnected,
        isLoading,
        isConnecting,
        savedSettings,
        connect,
        disconnect,
        checkStatus
    };
};

export default useCalendarConnection;

/**
 * useCalendarConnection Hook
 * 
 * Centralizes Google Calendar OAuth connection logic.
 * Updated to match backend/src/routes/googleCalendarRoutes.js
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import API_CONFIG from '@/config/api';
// import { CalendarSettings } from '@/lib/scheduleTypes'; // Not used in auth flow anymore

interface UseCalendarConnectionOptions {
    /** Session ID (not used strictly for auth-url but good for context if needed later) */
    sessionId: string;
    /** User ID (email) is REQUIRED for the backend endpoint (Entity ID) */
    userId?: string;
    /** Whether to check status on mount */
    autoCheck?: boolean;
    /** Callback when connection is successful */
    onConnected?: () => void;
    /** Callback when disconnection is successful */
    onDisconnected?: () => void;
}

interface UseCalendarConnectionReturn {
    isConnected: boolean;
    isLoading: boolean;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    checkStatus: () => Promise<void>;
}

export const useCalendarConnection = ({
    sessionId,
    userId,
    autoCheck = true,
    onConnected,
    onDisconnected
}: UseCalendarConnectionOptions): UseCalendarConnectionReturn => {
    const { authenticatedFetch } = useAuthenticatedFetch();
    const { toast } = useToast();

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    /**
     * Check the current connection status with the backend
     */
    const checkStatus = useCallback(async () => {
        if (!userId) return;

        // Don't set global loading if we are just polling (isConnecting is true)
        if (!isConnecting) setIsLoading(true);

        try {
            // Updated endpoint matches router code: router.get('/status', ...)
            const url = `${API_CONFIG.BASE_URL}/api/google-calendar/status?userId=${userId}`;

            const response = await authenticatedFetch(url);
            const data = await response.json();

            // Backend returns: { success: true, connected: boolean, ... }
            const isConnectedNow = data.connected || false;
            setIsConnected(isConnectedNow);

            if (isConnectedNow && isConnecting) {
                // If we were connecting and now we are connected, triggers might handle this outside
                setIsConnecting(false);
            }
            return isConnectedNow;
        } catch (error) {
            console.error('Erro ao verificar status do Calendar:', error);
            return false;
        } finally {
            if (!isConnecting) setIsLoading(false);
        }
    }, [userId, authenticatedFetch, isConnecting]);

    /**
     * Initiate the OAuth connection flow
     */
    const connect = useCallback(async () => {
        if (!userId) {
            toast({
                title: "Erro",
                description: "Email do usuário não identificado.",
                variant: "destructive"
            });
            return;
        }

        setIsConnecting(true);

        try {
            // Updated endpoint matches router code: router.get('/auth-url', ...)
            const url = `${API_CONFIG.BASE_URL}/api/google-calendar/auth-url?userId=${userId}`;

            const response = await authenticatedFetch(url);
            const data = await response.json();

            // data: { success: true, authUrl: string, connectionId: string }

            if (data.success && data.authUrl) {
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
                        // Final check
                        const finalStatus = await checkStatus();
                        if (finalStatus) {
                            if (onConnected) onConnected();
                            setIsConnected(true);
                        }
                        setIsConnecting(false);
                    } else {
                        // Poll backend for status
                        try {
                            // Use checkStatus to unify logic if possible, or keep direct fetch if checkStatus behavior (loading) is unwanted
                            // checkStatus sets isLoading, which might flicker. But we entered IsConnecting=true.
                            // To avoid flicker, we can do direct fetch or update checkStatus.
                            // Keeping direct fetch for polling loop to avoid side effects of checkStatus (like setIsLoading globally if we wanted)
                            // But actually checkStatus has `if (!isConnecting) setIsLoading(true)`. 
                            // Since isConnecting IS true here, checkStatus WON'T set loading.
                            // So we can use checkStatus!

                            const isNowConnected = await checkStatus();

                            if (isNowConnected) {
                                clearInterval(checkInterval);
                                try { authWindow?.close(); } catch (e) { }

                                setIsConnected(true);
                                setIsConnecting(false);

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
                throw new Error(data.error || 'URL de autenticação não recebida');
            }
        } catch (error: any) {
            console.error('Erro ao conectar Calendar:', error);
            setIsConnecting(false);
            toast({
                title: "Erro",
                description: error.message || "Falha ao iniciar conexão.",
                variant: "destructive"
            });
        }
    }, [userId, authenticatedFetch, toast, checkStatus, onConnected]);

    /**
     * Disconnect the calendar
     */
    const disconnect = useCallback(async () => {
        if (!userId) return;

        try {
            const url = `${API_CONFIG.BASE_URL}/api/google-calendar/disconnect`;
            const response = await authenticatedFetch(url, {
                method: 'POST',
                body: JSON.stringify({ userId: userId }),
            });

            if (!response.ok) {
                throw new Error('Falha ao desconectar');
            }

            setIsConnected(false);

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
    }, [userId, authenticatedFetch, toast, onDisconnected]);

    // Check status on mount if autoCheck is enabled
    useEffect(() => {
        if (autoCheck && userId) {
            checkStatus();
        }
    }, [autoCheck, userId, checkStatus]);

    return {
        isConnected,
        isLoading,
        isConnecting,
        connect,
        disconnect,
        checkStatus
    };
};

export default useCalendarConnection;

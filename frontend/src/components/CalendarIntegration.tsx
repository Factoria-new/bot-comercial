import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Loader2, ExternalLink, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API_CONFIG from '@/config/api';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import CalendarSettingsModal from './CalendarSettingsModal';

interface CalendarIntegrationProps {
    sessionId: string;
    userEmail: string;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ sessionId, userEmail }) => {
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);

    const { toast } = useToast();

    // Verificar status da conexão ao carregar
    useEffect(() => {
        checkConnectionStatus();
    }, [sessionId]);

    // Verificar parâmetros da URL (callback)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const calendarParam = urlParams.get('calendar');

        if (calendarParam === 'connected') {
            toast({
                title: "Google Calendar Conectado!",
                description: "Sua conta foi conectada com sucesso.",
            });

            // Limpar URL
            window.history.replaceState({}, '', '/dashboard');

            // Recarregar status
            checkConnectionStatus();
        } else if (calendarParam === 'error') {
            toast({
                title: "Erro na Conexão",
                description: "Não foi possível conectar ao Google Calendar. Tente novamente.",
                variant: "destructive"
            });

            window.history.replaceState({}, '', '/dashboard');
        }
    }, []);

    const checkConnectionStatus = async (connectionId?: string) => {
        if (!sessionId) return;

        setIsLoading(true);
        try {
            // Se tiver connectionId, passar na query string
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
    };

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [savedSettings, setSavedSettings] = useState<any>(null);

    // ... existing checkConnectionStatus ...

    const handleConnectClick = () => {
        setShowSettingsModal(true);
    };

    const handleModalConfirm = async (settings: any) => {
        if (!sessionId) return;

        setIsConnecting(true);
        // Fechar modal após iniciar conexão ou manter aberto com loading?
        // O modal tem loading state, então vamos manter e fechar só no sucesso/erro ou redirecionamento

        try {
            const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/calendar/connect`, {
                method: 'POST',
                body: JSON.stringify({
                    sessionId,
                    userId: userEmail,
                    settings // Enviando as configurações junto
                }),
            });

            const data = await response.json();

            if (data.alreadyConnected) {
                setIsConnected(true);
                setIsConnecting(false);
                setShowSettingsModal(false);
                toast({
                    title: "Conexão Reativada",
                    description: "Sua conta do Google Calendar foi reativada com sucesso.",
                });
                await checkConnectionStatus(data.connectionId);
                return;
            }

            if (data.authUrl && data.connectionId) {
                setShowSettingsModal(false); // Fecha o modal pois vai abrir popup

                // Abrir em uma nova janela/popup
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const authWindow = window.open(
                    data.authUrl,
                    'Connect Google Calendar',
                    `width=${width},height=${height},top=${top},left=${left}`
                );

                // Polling para verificar se conectou
                const startTime = Date.now();
                const checkInterval = setInterval(async () => {
                    // Timeout de 5 minutos
                    if (Date.now() - startTime > 300000) {
                        clearInterval(checkInterval);
                        setIsConnecting(false);
                        return;
                    }

                    let isWindowClosed = false;
                    try {
                        // Tentar ler closed, mas ignorar erro se bloqueado por COOP
                        isWindowClosed = !!authWindow?.closed;
                    } catch (e) {
                        // Ignorar erro de Cross-Origin
                    }

                    if (isWindowClosed) {
                        clearInterval(checkInterval);
                        await checkConnectionStatus(data.connectionId);
                        setIsConnecting(false);
                    } else {
                        // Verificar status no backend
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

                                const toastEl = document.createElement('div');
                                toastEl.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up';
                                toastEl.textContent = 'Google Calendar conectado com sucesso!';
                                document.body.appendChild(toastEl);
                                setTimeout(() => toastEl.remove(), 3000);
                            }
                        } catch (e) {
                            // Ignorar erros de rede temporários
                        }
                    }
                }, 2000);
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
    };

    const handleDisconnect = async () => {
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

            toast({
                title: "Desconectado",
                description: "Google Calendar desconectado com sucesso.",
            });
        } catch (error) {
            console.error('Erro ao desconectar Calendar:', error);
            toast({
                title: "Erro",
                description: "Não foi possível desconectar o Google Calendar.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="w-full max-w-[320px] aspect-square flex flex-col justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-[320px] aspect-square flex flex-col overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4 shrink-0">
                <CardTitle className="flex items-center gap-2 text-base text-[#00A947]">
                    <Calendar className="h-4 w-4" />
                    Google Calendar
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                    Agende eventos automaticamente via WhatsApp
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between p-4 pt-0 overflow-hidden">
                {/* Status da Conexão */}
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-2">
                    {isConnected ? (
                        <div className="text-center space-y-2">
                            <div className="bg-[#00A947]/10 p-3 rounded-full w-fit mx-auto">
                                <CheckCircle className="h-8 w-8 text-[#00A947]" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-[#00A947]">Conectado</p>
                                <p className="text-xs text-muted-foreground mt-1 px-2">
                                    Pronto para agendar e listar eventos
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <div className="bg-[#FE601E]/10 p-3 rounded-full w-fit mx-auto">
                                <Calendar className="h-8 w-8 text-[#FE601E]" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-[#FE601E]">Não Conectado</p>
                                <p className="text-xs text-muted-foreground mt-1 px-2">
                                    Conecte para habilitar agendamentos
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botão de Ação */}
                <div className="mt-auto pt-2 shrink-0">
                    {isConnected ? (
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettingsModal(true)}
                                className="flex-1 text-xs h-8 gap-2 hover:bg-gray-50"
                            >
                                <Settings className="h-3 w-3" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                                className="flex-1 text-xs h-8 border-[#FE601E] text-[#FE601E] hover:bg-[#FE601E]/10 hover:text-[#FE601E]"
                            >
                                Desconectar
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleConnectClick}
                            disabled={isConnecting}
                            className="w-full gap-2 text-xs h-8 bg-[#00A947] hover:bg-[#00A947]/90 text-white shadow-sm"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="h-3 w-3" />
                                    Conectar Conta Google
                                </>
                            )}
                        </Button>
                    )}

                    {!isConnected && (
                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                            🔒 Acesso seguro via OAuth 2.0
                        </p>
                    )}
                </div>
            </CardContent>

            <CalendarSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onConfirm={handleModalConfirm}
                isLoading={isConnecting}
                initialSettings={savedSettings}
            />
        </Card>
    );
};

export default CalendarIntegration;

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API_CONFIG from '@/config/api';

interface CalendarIntegrationProps {
    sessionId: string;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ sessionId }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('');
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
            const url = connectionId
                ? `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}?connectionId=${connectionId}`
                : `${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}`;

            const response = await fetch(url);
            const data = await response.json();

            setIsConnected(data.connected || false);
            setConnectionStatus(data.status || '');

            if (data.connected && isConnecting) {
                setIsConnecting(false);
            }
        } catch (error) {
            console.error('Erro ao verificar status do Calendar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!sessionId) return;

        setIsConnecting(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/calendar/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();

            if (data.authUrl && data.connectionId) {
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
                        isWindowClosed = authWindow?.closed;
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
                            const statusResponse = await fetch(`${API_CONFIG.BASE_URL}/api/calendar/status/${sessionId}?connectionId=${data.connectionId}`);
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
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/calendar/disconnect/${sessionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Falha ao desconectar');
            }

            setIsConnected(false);
            setConnectionStatus('');

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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Google Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Google Calendar
                </CardTitle>
                <CardDescription>
                    Conecte sua conta do Google para agendar eventos automaticamente via WhatsApp
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status da Conexão */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        {isConnected ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-medium">Conectado</p>
                                    <p className="text-sm text-muted-foreground">
                                        Sua conta Google está autorizada
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Não Conectado</p>
                                    <p className="text-sm text-muted-foreground">
                                        Conecte para habilitar agendamentos
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isConnecting && !isConnected && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => checkConnectionStatus()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Verificar
                            </Button>
                        )}

                        {isConnected ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                            >
                                Desconectar
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="gap-2"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Conectando...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="h-4 w-4" />
                                        Conectar
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Informações e Exemplos */}
                {isConnected && (
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">✅ Recursos Habilitados:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Criar eventos via WhatsApp</li>
                            <li>Listar seus compromissos</li>
                            <li>Buscar eventos por nome ou data</li>
                            <li>Atualizar eventos existentes</li>
                        </ul>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                💡 Exemplos de uso:
                            </p>
                            <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
                                <li>"Agende uma reunião amanhã às 14h"</li>
                                <li>"Quais são meus compromissos de hoje?"</li>
                                <li>"Marque um evento dia 15 às 10h"</li>
                            </ul>
                        </div>
                    </div>
                )}

                {!isConnected && (
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                            Ao conectar, você autoriza o bot a acessar seu Google Calendar para:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Criar eventos quando solicitado via WhatsApp</li>
                            <li>Listar seus compromissos</li>
                            <li>Atualizar eventos existentes</li>
                        </ul>
                        <p className="text-xs mt-3">
                            🔒 Suas credenciais Google são seguras e gerenciadas via OAuth 2.0
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CalendarIntegration;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Loader2, ExternalLink, Settings } from 'lucide-react';
import CalendarSettingsModal from './CalendarSettingsModal';
import { useCalendarConnection } from '@/hooks/useCalendarConnection';
import { CalendarSettings } from '@/lib/scheduleTypes';

import { useAuth } from '@/contexts/AuthContext';

interface CalendarIntegrationProps {
    sessionId: string;
    userEmail: string; // Kept for compatibility, unused internally
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ sessionId }) => {
    const { user } = useAuth();
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Use centralized calendar connection hook
    const {
        isConnected,
        isLoading,
        isConnecting,
        connect,
        disconnect
    } = useCalendarConnection({
        sessionId,
        userId: user?.uid,
        autoCheck: true
    });

    const handleConnectClick = () => {
        setShowSettingsModal(true);
    };

    const handleModalConfirm = async (settings: CalendarSettings) => {
        setShowSettingsModal(false);
        // settings ignored by hook currently
        await connect();
    };

    const handleDisconnect = async () => {
        await disconnect();
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
                initialSettings={undefined}
            />
        </Card>
    );
};

export default CalendarIntegration;

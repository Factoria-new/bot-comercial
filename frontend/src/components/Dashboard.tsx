import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MessageSquare, Users, Activity, Bot, Loader, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useNavigate } from 'react-router-dom';
import WhatsAppInstanceCard from './WhatsAppInstanceCard';
import WhatsAppConnectionModal, { ConnectionState } from './WhatsAppConnectionModal';
import AIStatusCard from '@/components/AIStatusCard';
import CalendarIntegration from '@/components/CalendarIntegration';
import { WhatsAppInstance, WhatsAppConfig } from '@/types/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/contexts/SocketContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import API_CONFIG from '@/config/api';

const Dashboard = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInstance, setCurrentInstance] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('generating');
  const [qrCode, setQrCode] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [removingInstances, setRemovingInstances] = useState<Set<number>>(new Set());
  const isRemovingRef = useRef(false);
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Bloquear botão de voltar
  useEffect(() => {
    // Adiciona um estado ao histórico para "prender" o usuário
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Impede a navegação voltando para o estado anterior (que é o atual)
      window.history.go(1);

      toast({
        title: "Ação não permitida",
        description: "Para voltar à tela de login, você deve sair da conta.",
        variant: "destructive",
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
      // Navega diretamente para o login, substituindo o histórico
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível realizar o logout.",
        variant: "destructive",
      });
    }
  };

  // Carregar todas as sessões do backend ao iniciar
  useEffect(() => {
    checkActiveSessions();
  }, []); // Executar apenas uma vez ao montar

  // Verificar status das instâncias periodicamente (silencioso)
  useEffect(() => {
    const interval = setInterval(() => {
      checkActiveSessions(true); // true = verificação silenciosa, sem toasts
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, []); // Executar apenas uma vez ao montar

  const checkActiveSessions = async (silent = false) => {
    // Se estiver removendo alguma instância, não atualizar a lista para evitar race conditions
    if (isRemovingRef.current) {
      console.log('⏳ Ignorando checkActiveSessions pois há remoções em andamento');
      return;
    }

    try {
      if (!silent) {
        setIsInitializing(true);
      }
      console.log('🔍 Verificando todas as sessões no backend...');

      // Buscar TODAS as sessões (ativas e inativas) do backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/sessions`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Falha ao buscar sessões');
      }

      const backendSessions = data.sessions || [];
      console.log(`📊 Encontradas ${backendSessions.length} sessões no backend`);

      // SEMPRE usar as sessões do backend como fonte única da verdade
      const instancesFromBackend: WhatsAppInstance[] = backendSessions.map((session: any) => {
        const instanceId = parseInt(session.sessionId.replace('instance_', ''));

        return {
          id: instanceId,
          name: session.config?.name || 'Nome do Agente',
          isConnected: session.connected,
          apiKey: session.config?.apiKey || '',
          assistantId: session.config?.assistantId || '',
          lastConnected: new Date(),
          phoneNumber: session.user?.phoneNumber || ''
        };
      });

      console.log('✅ Instâncias carregadas do backend:', instancesFromBackend);
      setInstances(instancesFromBackend);

      // Mostrar toast apenas se não for verificação silenciosa e houver sessões
      const connectedCount = instancesFromBackend.filter(i => i.isConnected).length;
      if (!silent && connectedCount > 0) {
        toast({
          title: "Sessões verificadas",
          description: `${connectedCount} sessão(ões) ativa(s) encontrada(s).`,
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessões ativas:', error);

      // Em caso de erro, manter instâncias existentes mas marcar como desconectadas
      setInstances(prevInstances =>
        prevInstances.map(instance => ({
          ...instance,
          isConnected: false
        }))
      );

      // Mostrar erro apenas se não for verificação silenciosa
      if (!silent) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível verificar o servidor. Verifique sua conexão.",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) {
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('qr', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setQrCode(data.qr);
        setConnectionState('ready');
      }
    });

    socket.on('pairing-code', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setPairingCode(data.code);
        setConnectionState('pairing');
      }
    });

    socket.on('qr-scanned', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setConnectionState('scanning');
      }
    });

    socket.on('connecting', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setConnectionState('connecting');
      }
    });

    socket.on('connected', (data) => {
      const instanceId = parseInt(data.sessionId.replace('instance_', ''));

      if (data.sessionId === `instance_${currentInstance}`) {
        setConnectionState('connected');

        setTimeout(() => {
          setIsModalOpen(false);
          setConnectionState('generating');
        }, 2000);
      }

      // Atualizar lista para TODOS os clientes conectados
      checkActiveSessions(true);
    });

    socket.on('user-info', (data) => {
      const instanceId = parseInt(data.sessionId.replace('instance_', ''));
      updateInstancePhone(instanceId, data.user?.number);
    });

    socket.on('qr-error', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setConnectionState('error');
        setErrorMessage(data.error);
      }
    });

    socket.on('logged-out', (data) => {
      const instanceId = parseInt(data.sessionId.replace('instance_', ''));

      // Atualizar lista para TODOS os clientes conectados
      checkActiveSessions(true);
    });

    return () => {
      socket.off('qr');
      socket.off('pairing-code');
      socket.off('qr-scanned');
      socket.off('connecting');
      socket.off('connected');
      socket.off('user-info');
      socket.off('qr-error');
      socket.off('logged-out');
    };
  }, [socket, currentInstance]);

  const updateInstanceStatus = (instanceId: number, isConnected: boolean) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, isConnected } : inst
    ));
  };

  const updateInstancePhone = (instanceId: number, phoneNumber: string) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, phoneNumber } : inst
    ));
  };

  const addInstance = async () => {
    // Verificar se já existem 4 instâncias
    if (instances.length >= 4) {
      toast({
        title: "Limite atingido",
        description: "Você pode criar no máximo 4 instâncias do WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const newId = Date.now();
    const newInstance: WhatsAppInstance = {
      id: newId,
      name: 'Nome do Agente',
      isConnected: false,
      apiKey: '',
      assistantId: '',
      lastConnected: new Date(),
    };

    // Persistir imediatamente no backend para evitar que suma no refresh/sync
    try {
      const initialConfig = {
        name: 'Nome do Agente',
        apiKey: '',
        assistantId: '',
        aiProvider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        systemPrompt: '',
        temperature: 1.0,
        ttsEnabled: false,
        ttsVoice: 'Aoede',
        enabled: true
      };

      // Salvar no backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/config/instance_${newId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initialConfig)
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configuração');
      }

      console.log('✅ Nova instância persistida no backend:', newId);

      // Atualizar estado local apenas após sucesso no backend
      setInstances(prev => [...prev, newInstance]);

    } catch (error) {
      console.error('Erro ao persistir nova instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: "Não foi possível salvar a nova instância no servidor.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = (instanceId: number) => {
    console.log('🎯 Dashboard handleGenerateQR:', instanceId);
    setCurrentInstance(instanceId);
    setIsModalOpen(true);
    setConnectionState('input-phone'); // Start with phone input
    setQrCode('');
    setPairingCode('');
  };

  const handleConnect = (phoneNumber: string) => {
    if (!currentInstance) return;

    const sessionId = `instance_${currentInstance}`;
    console.log('📡 Dashboard emitindo generate-qr com phone:', sessionId, phoneNumber);

    setConnectionState('generating');

    if (socket) {
      socket.emit('generate-qr', { sessionId, phoneNumber });
    } else {
      console.error('❌ Socket não disponível no Dashboard');
    }
  };

  const handleSaveConfig = async (instanceId: number, config: WhatsAppConfig) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId
        ? { ...inst, ...config }
        : inst
    ));
  };

  const handleDisconnect = async (instanceId: number) => {
    if (socket) {
      socket.emit('logout', { sessionId: `instance_${instanceId}` });
    }
    updateInstanceStatus(instanceId, false);
  };

  // ... (existing code)

  // ...

  const handleRemoveInstance = async (instanceId: number) => {
    // Adicionar à lista de instâncias sendo removidas
    setRemovingInstances(prev => new Set(prev).add(instanceId));
    isRemovingRef.current = true;

    try {
      // Chamar API para remover a sessão (backend cuidará do logout e limpeza de arquivos)
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/sessions/instance_${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover instância no backend');
      }

      // Aguardar a animação antes de remover da UI
      setTimeout(() => {
        // Remover a instância da lista
        setInstances(prev => prev.filter(inst => inst.id !== instanceId));

        // Remover da lista de instâncias sendo removidas
        setRemovingInstances(prev => {
          const newSet = new Set(prev);
          newSet.delete(instanceId);
          // Update ref if set is empty
          if (newSet.size === 0) isRemovingRef.current = false;
          return newSet;
        });

        toast({
          title: "Instância removida",
          description: "A instância foi removida com sucesso.",
        });
      }, 500); // Tempo da animação

    } catch (error) {
      console.error('Erro ao remover instância:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a instância. Tente novamente.",
        variant: "destructive",
      });

      // Remover da lista de loading em caso de erro
      setRemovingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        if (newSet.size === 0) isRemovingRef.current = false;
        return newSet;
      });
    }
  };

  const stats = {
    totalInstances: instances.length,
    connectedInstances: instances.filter(i => i.isConnected).length,
    totalMessages: 0,
    configuredInstances: instances.filter(i => i.apiKey && i.assistantId).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] to-white">
      {/* Efeito de luz sutil */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#19B159]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#19B159]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Loading Inicial */}
        {isInitializing && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-sm">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#19B159]/10 to-[#19B159]/20 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <Loader size={24} className="sm:w-8 sm:h-8 text-[#19B159] animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Verificando sessões ativas...</h3>
                <p className="text-xs sm:text-sm text-gray-600">Aguarde enquanto sincronizamos suas instâncias</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <div className="flex justify-center sm:justify-start mb-2">
                <img
                  src="/texto-logo.png"
                  alt="Bora Expandir - Agência de Viagens e Assessoria de Imigração"
                  className="h-16 sm:h-20 lg:h-24 w-auto"
                />
              </div>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Painel de Controle
              </p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Servidor Online' : 'Servidor Offline'}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full sm:w-auto bg-white/50 hover:bg-[#FE601E] hover:text-white border-[#FE601E]/20 text-[#FE601E] transition-colors"
              >
                <LogOut className="mr-2" size={18} />
                <span className="text-sm sm:text-base">Sair</span>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full sm:w-auto">
                      <Button
                        onClick={addInstance}
                        className="btn-new-instance disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                        size="default"
                        disabled={instances.length >= 4}
                      >
                        <PlusCircle className="mr-2" size={18} />
                        <span className="text-sm sm:text-base">Nova Instância</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {instances.length >= 4 && (
                    <TooltipContent>
                      <p>Limite máximo de 4 instâncias atingido</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/70 border border-[#19B159]/20 backdrop-blur-md card-stats shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Total</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#19B159]">{stats.totalInstances}/4</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {stats.totalInstances >= 4 ? 'limite atingido' : `${4 - stats.totalInstances} disponíveis`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 border border-[#19B159]/20 backdrop-blur-md card-stats shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Conectadas</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#19B159]">{stats.connectedInstances}</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">ativas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 border border-[#19B159]/20 backdrop-blur-md card-stats shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Mensagens</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#19B159]">{stats.totalMessages}</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">processadas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 border border-[#19B159]/20 backdrop-blur-md card-stats shadow-lg">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Assistentes</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#19B159]">{stats.configuredInstances}</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">configurados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* AI Status Card */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <AIStatusCard />
          </div>

          {/* Instances Grid */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Instâncias WhatsApp</h2>
            {instances.length === 0 ? (
              <Card className="border-dashed border-2 border-[#19B159]/30 bg-white/70 backdrop-blur-md shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <MessageSquare className="mx-auto text-[#19B159]/60 mb-4" size={40} />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhuma instância criada</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">Comece criando sua primeira instância do WhatsApp</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="w-full sm:w-auto">
                          <Button
                            onClick={addInstance}
                            className="btn-new-instance disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            disabled={instances.length >= 4}
                          >
                            <PlusCircle className="mr-2" size={18} />
                            <span className="text-sm sm:text-base">Criar Primeira Instância</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {instances.length >= 4 && (
                        <TooltipContent>
                          <p>Limite máximo de 4 instâncias atingido</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {instances.map((instance) => (
                  <WhatsAppInstanceCard
                    key={instance.id}
                    instance={instance}
                    onGenerateQR={handleGenerateQR}
                    onSaveConfig={handleSaveConfig}
                    onDisconnect={handleDisconnect}
                    onRemove={handleRemoveInstance}
                    isGeneratingQR={currentInstance === instance.id && connectionState === 'generating'}
                    isRemoving={removingInstances.has(instance.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Google Calendar Integration */}
        {instances.length > 0 && instances.some(i => i.isConnected) && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Integrações</h2>
            <CalendarIntegration
              sessionId={`instance_${instances.find(i => i.isConnected)?.id}`}
              userEmail={auth.currentUser?.email || ''}
            />
          </div>
        )}

        {/* Connection Modal */}
        <WhatsAppConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          connectionState={connectionState}
          qrCode={qrCode}
          pairingCode={pairingCode}
          errorMessage={errorMessage}
          instanceName={instances.find(i => i.id === currentInstance)?.name || ''}
          onConnect={handleConnect}
        />
      </div>
    </div>
  );
};

export default Dashboard;

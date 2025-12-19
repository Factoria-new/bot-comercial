import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useOnboarding } from '@/hooks/useOnboarding';
import API_CONFIG from '@/config/api';

// Chat Interface
import FactoriaChatInterface from '@/components/ui/factoria-chat-interface';
import DashboardSidebar from '@/components/DashboardSidebar';
import IntegrationsPanel from '@/components/chat/IntegrationsPanel';

// Legacy Components (for sidebar panels)
import WhatsAppInstanceCard from './WhatsAppInstanceCard';
import WhatsAppConnectionModal, { ConnectionState } from './WhatsAppConnectionModal';
import AIStatusCard from '@/components/AIStatusCard';
import { WhatsAppInstance, WhatsAppConfig } from '@/types/whatsapp';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MessageSquare, Loader, ArrowLeft } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

type DashboardPage = "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings";

const Dashboard = () => {
  // Current page state
  const [currentPage, setCurrentPage] = useState<DashboardPage>("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Onboarding state
  const { state: onboardingState, hasConnectedIntegrations } = useOnboarding();

  // WhatsApp instances state (preserved from original)
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const { authenticatedFetch } = useAuthenticatedFetch();
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Block back button
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = () => {
      window.history.go(1);
      toast({
        title: "Ação não permitida",
        description: "Para voltar à tela de login, você deve sair da conta.",
        variant: "destructive",
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
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

  // Load sessions on mount
  useEffect(() => {
    checkActiveSessions();
  }, []);

  // Periodic silent check
  useEffect(() => {
    const interval = setInterval(() => {
      checkActiveSessions(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkActiveSessions = async (silent = false) => {
    if (isRemovingRef.current) return;

    try {
      if (!silent) setIsInitializing(true);

      const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/whatsapp/sessions`);
      if (response.status === 401) return;

      const data = await response.json();
      if (!data.success) throw new Error('Falha ao buscar sessões');

      const backendSessions = data.sessions || [];
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

      setInstances(instancesFromBackend);
    } catch (error) {
      console.error('❌ Erro ao verificar sessões ativas:', error);
      setInstances(prev => prev.map(instance => ({ ...instance, isConnected: false })));
    } finally {
      if (!silent) setIsInitializing(false);
    }
  };

  // Socket event handlers
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
        setConnectionState(prev => {
          if (['generating', 'ready', 'selection', 'input-phone', 'pairing'].includes(prev)) {
            return prev;
          }
          return 'connecting';
        });
      }
    });

    socket.on('connected', (data) => {
      if (data.sessionId === `instance_${currentInstance}`) {
        setConnectionState('connected');
        setTimeout(() => {
          setIsModalOpen(false);
          setConnectionState('generating');
        }, 2000);
      }
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

    socket.on('logged-out', () => {
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

  const updateInstanceStatus = (instanceId: number, connected: boolean) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, isConnected: connected } : inst
    ));
  };

  const updateInstancePhone = (instanceId: number, phoneNumber: string) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, phoneNumber } : inst
    ));
  };

  const addInstance = async () => {
    if (instances.length >= 4) {
      toast({
        title: "Limite atingido",
        description: "Você pode criar no máximo 4 conexões do WhatsApp.",
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

      const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/whatsapp/config/instance_${newId}`, {
        method: 'POST',
        body: JSON.stringify(initialConfig)
      });

      if (!response.ok) throw new Error('Falha ao salvar configuração');

      setInstances(prev => [...prev, newInstance]);
    } catch (error) {
      console.error('Erro ao persistir nova conexão:', error);
      toast({
        title: "Erro ao criar conexão",
        description: "Não foi possível salvar a nova conexão no servidor.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = (instanceId: number) => {
    setCurrentInstance(instanceId);
    setIsModalOpen(true);
    const sessionId = `instance_${instanceId}`;
    setConnectionState('generating');
    setQrCode('');
    setPairingCode('');
    if (socket) {
      socket.emit('generate-qr', { sessionId });
    }
  };

  const handleMethodSelected = (method: 'qr' | 'code') => {
    if (method === 'code') {
      setConnectionState('input-phone');
    } else {
      if (!currentInstance) return;
      const sessionId = `instance_${currentInstance}`;
      setConnectionState('generating');
      if (socket) {
        socket.emit('generate-qr', { sessionId });
      }
    }
  };

  const handleConnect = (phoneNumber: string) => {
    if (!currentInstance) return;
    const sessionId = `instance_${currentInstance}`;
    setConnectionState('generating');
    if (socket) {
      socket.emit('generate-qr', { sessionId, phoneNumber });
    }
  };

  const handleSaveConfig = async (instanceId: number, config: WhatsAppConfig) => {
    setInstances(prev => prev.map(inst =>
      inst.id === instanceId ? { ...inst, ...config } : inst
    ));
  };

  const handleDisconnect = async (instanceId: number) => {
    if (socket) {
      socket.emit('logout', { sessionId: `instance_${instanceId}` });
    }
    updateInstanceStatus(instanceId, false);
  };

  const handleRemoveInstance = async (instanceId: number) => {
    setRemovingInstances(prev => new Set(prev).add(instanceId));
    isRemovingRef.current = true;

    try {
      const response = await authenticatedFetch(`${API_CONFIG.BASE_URL}/api/whatsapp/sessions/instance_${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Falha ao remover conexão');

      setTimeout(() => {
        setInstances(prev => prev.filter(inst => inst.id !== instanceId));
        setRemovingInstances(prev => {
          const newSet = new Set(prev);
          newSet.delete(instanceId);
          if (newSet.size === 0) isRemovingRef.current = false;
          return newSet;
        });
        toast({
          title: "Conexão removida",
          description: "A conexão foi removida com sucesso.",
        });
      }, 500);
    } catch (error) {
      console.error('Erro ao remover conexão:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a conexão.",
        variant: "destructive",
      });
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
  };

  // Render panel content based on current page
  const renderPanelContent = () => {
    switch (currentPage) {
      case "connections":
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage("chat")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Conexões WhatsApp</h1>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={addInstance}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        disabled={instances.length >= 4}
                      >
                        <PlusCircle className="mr-2" size={18} />
                        Nova Conexão
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {instances.length >= 4 && (
                    <TooltipContent>
                      <p>Limite de 4 conexões atingido</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>

            {instances.length === 0 ? (
              <Card className="border-dashed border-2 border-emerald-200 bg-white/70">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mx-auto text-emerald-500/60 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conexão criada</h3>
                  <p className="text-gray-600 mb-4">Comece criando sua primeira conexão do WhatsApp</p>
                  <Button onClick={addInstance} className="bg-emerald-600 hover:bg-emerald-700">
                    <PlusCircle className="mr-2" size={18} />
                    Criar Primeira Conexão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        );

      case "integrations":
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage("chat")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Integrações</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onboardingState.integrations.map((integration) => (
                <Card key={integration.id} className={cn(
                  "bg-white/70 transition-all",
                  integration.connected ? "border-emerald-500" : "border-gray-200"
                )}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: integration.color }}
                    >
                      <span className="text-white text-xl font-bold">
                        {integration.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{integration.name}</p>
                      <p className="text-sm text-gray-500">
                        {integration.connected ? "Conectado" : "Não conectado"}
                      </p>
                    </div>
                    {integration.connected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "ai-status":
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage("chat")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Status da IA</h1>
            </div>
            <AIStatusCard />
          </div>
        );

      case "calendar":
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage("chat")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendário</h1>
            </div>
            <Card className="bg-white/70">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-600">Integração com Google Calendar em breve.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage("chat")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Configurações</h1>
            </div>
            <Card className="bg-white/70">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-600">Configurações em desenvolvimento.</p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isInitializing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center animate-pulse">
              <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Verificando sessões...</h3>
              <p className="text-sm text-white/60">Aguarde enquanto sincronizamos</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentPage === "chat" ? (
        <FactoriaChatInterface
          onLogout={handleLogout}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {renderPanelContent()}
        </div>
      )}

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        connectedInstances={stats.connectedInstances}
        totalInstances={stats.totalInstances}
        integrations={onboardingState.integrations}
      />

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
        onMethodSelected={handleMethodSelected}
      />
    </>
  );
};

export default Dashboard;

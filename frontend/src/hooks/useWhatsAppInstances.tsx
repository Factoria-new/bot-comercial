import { useState, useEffect, useCallback } from 'react';
import { WhatsAppInstance } from '@/types/whatsapp';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
// Define ConnectionState locally to avoid export issues
export type ConnectionState = 'idle' | 'generating' | 'ready' | 'scanning' | 'connecting' | 'connected' | 'error' | 'already-connected';

interface ModalState {
  isOpen: boolean;
  instanceId: number | null;
  connectionState: ConnectionState;
  errorMessage?: string;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState<number | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    instanceId: null,
    connectionState: 'idle'
  });
  const { generateQR, logout } = useSocket();
  const { user } = useAuth();

  // Inicializar conexões
  useEffect(() => {
    const initialInstances: WhatsAppInstance[] = [1, 2, 3, 4].map(id => ({
      id,
      name: `Conexão ${id}`,
      isConnected: false,
      apiKey: '',
      assistantId: ''
    }));
    setInstances(initialInstances);

    // Check status on mount to restore connection state
    const checkInstancesStatus = async () => {
      // Implement status check logic if not already available in context
      // Or if using socket events, ensure we request status
      // Since useSocket might not expose a direct check, we might rely on the socket connection event
      // But the user says "Ao recarregar a página o 'conectado' com o WhatsApp é perdido"
      // This implies we need to proactively ask "Am I connected?"
      // The backend has `GET /api/whatsapp/status/:sessionId`.
      // Let's implement that fetch here.
      try {
        initialInstances.forEach(async (instance) => {
          const response = await fetch(`/api/whatsapp/status/instance_${instance.id}`);
          const data = await response.json();
          if (data.status === 'connected') {
            setInstances(prev => prev.map(inst =>
              inst.id === instance.id ? { ...inst, isConnected: true } : inst
            ));
          }
        });
      } catch (error) {
        console.error("Failed to check WhatsApp status:", error);
      }
    };

    checkInstancesStatus();
  }, []);

  // Listener para eventos do WhatsApp
  useEffect(() => {
    // Helper: verifica se o sessionId pertence ao usuário atual
    const isMySession = (sessionId: string) => {
      if (!user?.uid) return false;
      return sessionId === `user_${user.uid}`;
    };

    const handleQR = (event: CustomEvent) => {
      const { qr, sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      // Ignorar eventos de QR se já está conectado (evita sobrescrever estado)
      if (modalState.connectionState === 'already-connected' || modalState.connectionState === 'connected') {
        console.log('⚠️ Ignorando QR event - sessão já conectada');
        return;
      }

      // Atualizar a primeira instância com o QR code (usuário tem apenas 1)
      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? { ...instance, qrCode: qr } : instance
      ));

      // Atualizar modal para mostrar código
      if (modalState.isOpen) {
        setModalState(prev => ({ ...prev, connectionState: 'ready' }));
      }
    };

    const handleQRScanned = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      // Atualizar modal para mostrar que o QR foi escaneado
      if (modalState.isOpen) {
        setModalState(prev => ({ ...prev, connectionState: 'scanning' }));
      }
    };

    const handleConnecting = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      // Atualizar modal para mostrar que está conectando
      if (modalState.isOpen) {
        setModalState(prev => {
          if (['generating', 'ready', 'selection', 'input-phone', 'pairing'].includes(prev.connectionState)) {
            return prev;
          }
          return { ...prev, connectionState: 'connecting' };
        });
      }
    };

    const handleConnected = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      // Atualizar a primeira instância como conectada
      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? {
          ...instance,
          isConnected: true,
          qrCode: undefined,
          lastConnected: new Date()
        } : instance
      ));

      // Atualizar modal
      if (modalState.isOpen) {
        setModalState(prev => ({ ...prev, connectionState: 'connecting' }));
        setTimeout(() => {
          setModalState(prev => ({ ...prev, connectionState: 'connected' }));
        }, 4000);
      }

      setIsGeneratingQR(null);
    };

    const handleUserInfo = (event: CustomEvent) => {
      const { sessionId, user: whatsappUser } = event.detail;
      if (!isMySession(sessionId)) return;

      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? { ...instance, phoneNumber: whatsappUser.number } : instance
      ));
    };

    const handleAlreadyConnected = (event: CustomEvent) => {
      const { sessionId, user: whatsappUser } = event.detail;
      if (!isMySession(sessionId)) return;

      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? {
          ...instance,
          isConnected: true,
          phoneNumber: whatsappUser?.number,
          qrCode: undefined
        } : instance
      ));

      // Mostrar modal com estado "already-connected" em vez de fechar
      if (modalState.isOpen) {
        setModalState(prev => ({ ...prev, connectionState: 'already-connected' }));
      }

      setIsGeneratingQR(null);
    };

    const handleLoggedOut = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? {
          ...instance,
          isConnected: false,
          qrCode: undefined,
          phoneNumber: undefined,
          lastConnected: undefined
        } : instance
      ));
    };

    const handleQRError = (event: CustomEvent) => {
      const { sessionId, error } = event.detail;
      if (!isMySession(sessionId)) return;

      if (modalState.isOpen) {
        setModalState(prev => ({
          ...prev,
          connectionState: 'error',
          errorMessage: error || 'Erro ao gerar Código'
        }));
      }

      setIsGeneratingQR(null);
    };

    const handleConnectionError = (event: CustomEvent) => {
      const { sessionId, error } = event.detail;
      if (!isMySession(sessionId)) return;

      if (modalState.isOpen) {
        setModalState(prev => ({
          ...prev,
          connectionState: 'error',
          errorMessage: error || 'Erro de conexão'
        }));
      }

      setIsGeneratingQR(null);
    };

    const handleDisconnected = (event: CustomEvent) => {
      const { sessionId, willReconnect } = event.detail;
      if (!isMySession(sessionId)) return;

      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? {
          ...instance,
          isConnected: false,
          isReconnecting: willReconnect,
          qrCode: undefined
        } : instance
      ));
    };

    const handleReconnectionFailed = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      if (!isMySession(sessionId)) return;

      setInstances(prev => prev.map((instance, index) =>
        index === 0 ? {
          ...instance,
          isConnected: false,
          isReconnecting: false,
          qrCode: undefined,
          phoneNumber: undefined,
          lastConnected: undefined
        } : instance
      ));
    };

    // Adicionar listeners
    window.addEventListener('whatsapp-qr', handleQR as EventListener);
    window.addEventListener('whatsapp-qr-scanned', handleQRScanned as EventListener);
    window.addEventListener('whatsapp-connecting', handleConnecting as EventListener);
    window.addEventListener('whatsapp-connected', handleConnected as EventListener);
    window.addEventListener('whatsapp-user-info', handleUserInfo as EventListener);
    window.addEventListener('whatsapp-already-connected', handleAlreadyConnected as EventListener);
    window.addEventListener('whatsapp-logged-out', handleLoggedOut as EventListener);
    window.addEventListener('whatsapp-qr-error', handleQRError as EventListener);
    window.addEventListener('whatsapp-connection-error', handleConnectionError as EventListener);
    window.addEventListener('whatsapp-disconnected', handleDisconnected as EventListener);
    window.addEventListener('whatsapp-reconnection-failed', handleReconnectionFailed as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('whatsapp-qr', handleQR as EventListener);
      window.removeEventListener('whatsapp-qr-scanned', handleQRScanned as EventListener);
      window.removeEventListener('whatsapp-connecting', handleConnecting as EventListener);
      window.removeEventListener('whatsapp-connected', handleConnected as EventListener);
      window.removeEventListener('whatsapp-user-info', handleUserInfo as EventListener);
      window.removeEventListener('whatsapp-already-connected', handleAlreadyConnected as EventListener);
      window.removeEventListener('whatsapp-logged-out', handleLoggedOut as EventListener);
      window.removeEventListener('whatsapp-qr-error', handleQRError as EventListener);
      window.removeEventListener('whatsapp-connection-error', handleConnectionError as EventListener);
      window.removeEventListener('whatsapp-disconnected', handleDisconnected as EventListener);
      window.removeEventListener('whatsapp-reconnection-failed', handleReconnectionFailed as EventListener);
    };
  }, [modalState.isOpen, modalState.connectionState, user?.uid]);

  const handleGenerateQR = useCallback(async (instanceId: number) => {
    if (!user?.uid) {
      console.error('❌ Usuário não autenticado, não é possível gerar QR');
      return;
    }

    setIsGeneratingQR(instanceId);

    // Abrir modal com estado "generating"
    setModalState({
      isOpen: true,
      instanceId,
      connectionState: 'generating'
    });

    // Usar userId como sessionId para garantir isolamento entre usuários
    // Cada usuário terá sua própria sessão única
    const sessionId = `user_${user.uid}`;
    generateQR(sessionId, undefined, user.uid);
  }, [generateQR, user]);

  const handleDisconnect = useCallback(async () => {
    if (!user?.uid) return;
    const sessionId = `user_${user.uid}`;
    logout(sessionId);
  }, [logout, user]);

  const handleSaveConfig = useCallback(async (instanceId: number, config: { name: string; apiKey: string; assistantId: string }) => {
    setInstances(prev => prev.map(instance =>
      instance.id === instanceId ? {
        ...instance,
        name: config.name,
        apiKey: config.apiKey,
        assistantId: config.assistantId
      } : instance
    ));

    // Aqui você pode adicionar uma chamada à API para salvar as configurações no backend
    console.log(`Configurações salvas para conexão ${instanceId}:`, config);
  }, []);

  const closeModal = useCallback(() => {
    // Limpar o estado isGeneratingQR ao fechar o modal
    setIsGeneratingQR(null);

    // Limpar código da conexão se o modal foi fechado sem conectar
    if (modalState.instanceId) {
      setInstances(prev => prev.map(instance =>
        instance.id === modalState.instanceId && !instance.isConnected ? {
          ...instance,
          qrCode: undefined
        } : instance
      ));
    }

    // Fechar o modal
    setModalState({
      isOpen: false,
      instanceId: null,
      connectionState: 'idle'
    });
  }, [modalState.instanceId]);

  return {
    instances,
    isGeneratingQR,
    handleGenerateQR,
    handleDisconnect,
    handleSaveConfig,
    modalState,
    closeModal
  };
}; 
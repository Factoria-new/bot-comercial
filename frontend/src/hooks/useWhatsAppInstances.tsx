import { useState, useEffect, useCallback } from 'react';
import { WhatsAppInstance } from '@/types/whatsapp';
import { useSocket } from '@/contexts/SocketContext';
import { ConnectionState } from '@/components/WhatsAppConnectionModal';
import API_CONFIG from '@/config/api';

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
    connectionState: 'generating'
  });
  const { generateQR, logout } = useSocket();

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

    // Verificar status das conexões no backend
    checkInstancesStatus();
  }, []);

  // Verificar status das conexões
  const checkInstancesStatus = async () => {
    try {
      for (let i = 1; i <= 4; i++) {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSION_STATUS(`instance_${i}`)}`);
        const data = await response.json();

        if (data.connected && data.user) {
          setInstances(prev => prev.map(instance =>
            instance.id === i ? {
              ...instance,
              isConnected: true,
              phoneNumber: data.user.phoneNumber,
              lastConnected: new Date()
            } : instance
          ));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status das conexões:', error);
    }
  };

  // Listener para eventos do WhatsApp
  useEffect(() => {
    const handleQR = (event: CustomEvent) => {
      const { qr, sessionId } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar conexão com código
      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
          ...instance,
          qrCode: qr
        } : instance
      ));

      // Atualizar modal para mostrar código
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        setModalState(prev => ({ ...prev, connectionState: 'ready' }));
      }
    };

    const handleQRScanned = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar modal para mostrar que o QR foi escaneado
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        setModalState(prev => ({ ...prev, connectionState: 'scanning' }));
      }
    };

    const handleConnecting = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar modal para mostrar que está conectando
      // FIX: Só mostrar "conectando" se já tivermos passado pelo scan ('scanning')
      // Isso evita mostrar "Conectando..." prematuramente enquanto o QR ainda está sendo gerado
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        setModalState(prev => {
          // Se estivermos em states iniciais, ignorar o evento 'connecting'
          if (['generating', 'ready', 'selection', 'input-phone', 'pairing'].includes(prev.connectionState)) {
            return prev;
          }
          return { ...prev, connectionState: 'connecting' };
        });
      }
    };

    const handleConnected = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar conexão como conectada
      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
          ...instance,
          isConnected: true,
          qrCode: undefined,
          lastConnected: new Date()
        } : instance
      ));

      // Atualizar modal
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        // FORCE 'connecting' state first to show animation
        setModalState(prev => ({ ...prev, connectionState: 'connecting' }));

        // Wait 4 seconds for the cycle to complete
        setTimeout(() => {
          setModalState(prev => ({ ...prev, connectionState: 'connected' }));
        }, 4000);
      }

      setIsGeneratingQR(null);
    };

    const handleUserInfo = (event: CustomEvent) => {
      const { sessionId, user } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
          ...instance,
          phoneNumber: user.number
        } : instance
      ));
    };

    const handleAlreadyConnected = (event: CustomEvent) => {
      const { sessionId, user } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
          ...instance,
          isConnected: true,
          phoneNumber: user?.number,
          qrCode: undefined
        } : instance
      ));

      // Fechar modal se já estiver conectado
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        setModalState({ isOpen: false, instanceId: null, connectionState: 'generating' });
      }

      setIsGeneratingQR(null);
    };

    const handleLoggedOut = (event: CustomEvent) => {
      const { sessionId } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
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
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar modal para mostrar erro
      if (modalState.isOpen && modalState.instanceId === instanceId) {
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
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar modal para mostrar erro
      if (modalState.isOpen && modalState.instanceId === instanceId) {
        setModalState(prev => ({
          ...prev,
          connectionState: 'error',
          errorMessage: error || 'Erro de conexão'
        }));
      }

      setIsGeneratingQR(null);
    };

    const handleDisconnected = (event: CustomEvent) => {
      const { sessionId, reason, willReconnect } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar conexão como desconectada
      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
          ...instance,
          isConnected: false,
          isReconnecting: willReconnect, // Adicionar flag de reconexão
          qrCode: undefined
        } : instance
      ));
    };

    const handleReconnectionFailed = (event: CustomEvent) => {
      const { sessionId, error } = event.detail;
      const instanceId = parseInt(sessionId.split('_')[1]);

      // Atualizar conexão para indicar que a reconexão falhou
      setInstances(prev => prev.map(instance =>
        instance.id === instanceId ? {
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
  }, [modalState.isOpen, modalState.instanceId]);

  const handleGenerateQR = useCallback(async (instanceId: number) => {
    setIsGeneratingQR(instanceId);

    // Abrir modal com estado "generating"
    setModalState({
      isOpen: true,
      instanceId,
      connectionState: 'generating'
    });

    const sessionId = `instance_${instanceId}`;
    generateQR(sessionId);
  }, [generateQR]);

  const handleDisconnect = useCallback(async (instanceId: number) => {
    const sessionId = `instance_${instanceId}`;
    logout(sessionId);
  }, [logout]);

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
      connectionState: 'generating'
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
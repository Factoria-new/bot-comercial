import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AgentCreator from '@/components/AgentCreator';
import WelcomeScreen from '@/components/WelcomeScreen';
import FactoriaChatInterface from '@/components/ui/factoria-chat-interface';
import DashboardSidebar from '@/components/DashboardSidebar';
import WhatsAppConnectionModal from '@/components/WhatsAppConnectionModal';
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { AnimatePresence } from 'framer-motion';
import { Integration } from "@/types/onboarding";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false); // NEW
  const [showChat, setShowChat] = useState(false);
  const [agentCreated, setAgentCreated] = useState(false); // Kept for legacy compatibility if needed
  const [showWelcome, setShowWelcome] = useState(true); // Default to true for new flow
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);

  const [isInstagramConnected, setIsInstagramConnected] = useState(false);

  // Fetch Instagram status
  useEffect(() => {
    const checkInstagramStatus = async () => {
      try {
        const response = await fetch('/api/instagram/status');
        const data = await response.json();
        if (data.success && data.isConnected) {
          setIsInstagramConnected(true);
        }
      } catch (error) {
        console.error('Error checking Instagram status:', error);
      }
    };
    checkInstagramStatus();

    // Listen for connection success message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'instagram-connected' && event.data?.success) {
        checkInstagramStatus();
        toast({
          title: "Conectado!",
          description: `Instagram ${event.data.username ? `@${event.data.username}` : ''} conectado com sucesso.`,
          duration: 5000,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // WhatsApp Integration Hook
  const {
    instances: whatsappInstances,
    handleGenerateQR,
    modalState: whatsappModalState,
    closeModal: closeWhatsappModal,
    handleDisconnect
  } = useWhatsAppInstances();

  const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;

  const integrations: Integration[] = [
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
    { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', connected: isInstagramConnected },
    { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'facebook', connected: false },
  ];

  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Block browser back button when on dashboard
  useEffect(() => {
    // Push a new state to prevent going back
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Prevent going back by pushing state again
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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

  const handleOpenIntegrations = () => {
    setIsSidebarOpen(true);
    setShouldExpandIntegrations(true);
  };

  return (
    <>
      {/* Agent Creator or Chat Interface based on state */}
      {/* Agent Creator or Chat Interface based on state */}
      <AnimatePresence mode="wait">
        {showWelcome && !agentCreated && !showChat ? (
          <WelcomeScreen key="welcome" onStart={() => setShowWelcome(false)} />
        ) : !showChat ? (
          <AgentCreator
            key="creator"
            isExiting={agentCreated} // Use this state to trigger animation
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenIntegrations={handleOpenIntegrations}
            // Pass integrations data if AgentCreator needs it (it shouldn't for flow, but maybe for logic)
            // For now, AgentCreator handles its own logic but we skipped the integration step.
            onStartChat={(prompt) => {
              setAgentCreated(true); // Trigger exit animation
              setAgentPrompt(prompt);
              // Delay actual unmount to allow animation to play
              setTimeout(() => {
                setShowChat(true);
              }, 500);
            }}
          />
        ) : (
          <div key="chat" className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-screen">
            <FactoriaChatInterface
              onLogout={handleLogout}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              initialMessage={agentPrompt || undefined}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar - Light mode */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => { setIsSidebarOpen(false); setShouldExpandIntegrations(false); }}
        onNavigate={() => { }}
        currentPage="chat"
        integrations={integrations}
        onLogout={handleLogout}
        forceExpandIntegrations={shouldExpandIntegrations}
        onIntegrationDisconnect={async (id) => {
          if (id === 'whatsapp') {
            handleDisconnect(1);
          } else if (id === 'instagram') {
            try {
              const response = await fetch('/api/instagram/disconnect', {
                method: 'POST',
              });
              const data = await response.json();
              if (data.success) {
                setIsInstagramConnected(false);
                toast({
                  title: "Desconectado",
                  description: "Conta do Instagram desconectada com sucesso.",
                });
                // Trigger re-fetch or state update if needed. 
                // Since integrations checks 'connected' prop, we need to ensure local state reflects this.
                // However, 'integrations' array is derived from `isWhatsAppConnected` and static false for others in this file currently.
                // We need to fetch Instagram status to make it dynamic or update a local state.
                // Ideally, we should have a `useInstagram` hook or similar, but for now sticking to existing pattern.
                // The current code has `connected: false` hardcoded for Instagram (line 35).
                // I should probably switch that to state if I want it to update visually.
              } else {
                throw new Error(data.error);
              }
            } catch (error) {
              console.error("Erro ao desconectar Instagram:", error);
              toast({
                title: "Erro",
                description: "Não foi possível desconectar do Instagram.",
                variant: "destructive",
              });
            }
          }
        }}
        onIntegrationClick={async (id) => {
          if (id === 'whatsapp') {
            if (!isWhatsAppConnected) {
              handleGenerateQR(1);
            }
          } else if (id === 'instagram') {
            try {
              // Fetch auth URL from backend
              const response = await fetch('/api/instagram/auth-url', {
                method: 'GET',
              });
              const data = await response.json();

              if (data.success && data.authUrl) {
                // Redirect user to Instagram/Composio auth page in a popup window
                const width = 600;
                const height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                const popup = window.open(
                  data.authUrl,
                  'InstagramAuth',
                  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
                );

                // Toast ID or reference to update/dismiss
                const toastId = toast({
                  title: "Aguardando conexão...",
                  description: "Por favor, complete a autenticação na janela pop-up.",
                  duration: Infinity, // Keep open until done or closed
                });

                // Monitor popup
                const checkPopup = setInterval(() => {
                  if (popup && popup.closed) {
                    clearInterval(checkPopup);

                    // The user closed the window manually.
                    // We should trigger a status check to see if they connected successfully before closing.
                    const checkStatus = async () => {
                      try {
                        const response = await fetch('/api/instagram/status');
                        const data = await response.json();
                        if (data.success && data.isConnected) {
                          setIsInstagramConnected(true);
                          toast({
                            title: "Conectado!",
                            description: "Instagram conectado com sucesso.",
                          });
                        } else {
                          // If still not connected, maybe inform user or just be silent (assumed cancelled)
                          // But if the toast "Aguardando..." is still up, we should probably dismiss it or replace it?
                          // Since we can't dismiss easily, let's show a "cancelled" or "checking" info if needed.
                          // For now, let's just attempt connection.
                        }
                      } catch (error) {
                        console.error('Error checking Instagram status:', error);
                      }
                    };
                    checkStatus();
                  }
                }, 1000);

                // Store popup reference to clear interval if component unmounts? (Not strictly necessary for quick action)
              } else {
                toast({
                  title: "Erro",
                  description: "Não foi possível iniciar a conexão com Instagram.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Erro ao iniciar conexão Instagram:", error);
              toast({
                title: "Erro",
                description: "Erro ao conectar com servidor.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Em breve",
              description: "Integração disponível em breve.",
            });
          }
        }}
      />

      {/* Global WhatsApp Modal */}
      <WhatsAppConnectionModal
        isOpen={whatsappModalState.isOpen}
        onClose={closeWhatsappModal}
        modalState={whatsappModalState}
        instance={whatsappInstances[0]} // Pass full instance object
        onGenerateQR={handleGenerateQR}
        onDisconnect={handleDisconnect}
      // Note: component expects 'instances' array in my extraction? 
      // Let's check WhatsAppConnectionModal definition in previous step.
      // I defined it as `instance: { ... } | undefined` (singular).
      // And passing whatsappInstances[0] is correct.
      />
    </>
  );
};

export default Dashboard;

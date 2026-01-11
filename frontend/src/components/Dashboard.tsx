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
  // Hooks declarations first
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load persisted state from localStorage
  const getPersistedState = () => {
    try {
      const saved = localStorage.getItem('dashboard_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading persisted state:', e);
    }
    return null;
  };

  const persistedState = getPersistedState();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);
  const [showChat, setShowChat] = useState(persistedState?.showChat || false);
  const [agentCreated, setAgentCreated] = useState(persistedState?.agentCreated || false);
  const [showWelcome, setShowWelcome] = useState(persistedState?.showWelcome ?? true);
  const [agentPrompt, setAgentPrompt] = useState<string | null>(persistedState?.agentPrompt || null);

  // Persist state when it changes
  useEffect(() => {
    const stateToSave = { showChat, agentCreated, showWelcome, agentPrompt };
    localStorage.setItem('dashboard_state', JSON.stringify(stateToSave));
  }, [showChat, agentCreated, showWelcome, agentPrompt]);




  // WhatsApp Integration Hook
  const {
    instances: whatsappInstances,
    handleGenerateQR,
    modalState: whatsappModalState,
    closeModal: closeWhatsappModal,
    handleDisconnect
  } = useWhatsAppInstances();

  const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;
  const currentSessionId = String(whatsappInstances[0]?.id || '1');

  const integrations: Integration[] = [
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
  ];

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
        onIntegrationDisconnect={(id) => {
          if (id === 'whatsapp' && whatsappInstances.length > 0) {
            handleDisconnect(whatsappInstances[0].id);
          }
        }}
        sessionId={currentSessionId}
        onIntegrationClick={async (id) => {
          if (id === 'whatsapp') {
            if (!isWhatsAppConnected) {
              handleGenerateQR(1);
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

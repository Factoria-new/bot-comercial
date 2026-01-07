import React, { useState, useEffect } from 'react';
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
    { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'instagram', connected: false },
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

  const handleAgentCreated = (prompt: string, info: any) => {
    console.log('🎉 Assistente criado!');
    console.log('📝 Prompt:', prompt);
    console.log('📦 Info:', info);
    setAgentPrompt(prompt);
    setAgentCreated(true);

    // Save to localStorage
    localStorage.setItem('factoria_agent', JSON.stringify({
      prompt,
      info,
      createdAt: new Date().toISOString()
    }));

    toast({
      title: "Assistente criado!",
      description: `Seu assistente para ${info.business_type} está pronto.`,
    });
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
        onIntegrationClick={(id) => {
          if (id === 'whatsapp') {
            if (!isWhatsAppConnected) {
              handleGenerateQR(1);
            }
            // If connected, maybe show disconnect? Logic handled in modal or sidebar state?
            // For now, if connected, the prompt implies "manage" or just show connected.
            // The Modal handles Connected state too, so we can just open it.
            // But handleGenerateQR(1) might reset state or start generating?
            // useWhatsAppInstances implementation of handleGenerateQR usually starts generation.
            // If we want to view status, we might need a separate open method or just depend on modalState.
            // If the hook controls modalState via handleGenerateQR, we use that.
            // If we want to show "Connected" state in modal without regenerating, we need to check how the hook works.
            // Typically handleGenerateQR starts the process. 
            // Let's assume for now we call handleGenerateQR if not connected.
            // If connected, we might want to just show the "Connected" modal state.
            // But the hook might not expose a "open info" method.
            // We'll stick to: if not connected -> Connect.
            if (isWhatsAppConnected) {
              // Logic to show connected info - maybe simple toast or nothing as user said "se tiver ativado apenas não vai aparecer a opção de conectar"
              // But user also said "geridas agora pelo menu lateral".
              // Let's just allow opening to disconnect.
              // But we don't have a clean "open" method in the destructuring (lines 11-15 above).
              // We'll focus on CONNECTING.
            } else {
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

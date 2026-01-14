import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AgentCreator from '@/components/AgentCreator';
import WelcomeScreen from '@/components/WelcomeScreen';
import { DashboardStep } from '@/components/agent-creator/DashboardStep';
import DashboardSidebar from '@/components/DashboardSidebar';
import WhatsAppConnectionModal from '@/components/WhatsAppConnectionModal';
import LiaSidebar from '@/components/LiaSidebar';
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useSocket } from '@/contexts/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Integration } from "@/types/onboarding";
import { promptService } from '@/services/promptService';

const Dashboard = () => {
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // =====================
  // SIMPLIFIED STATE MODEL
  // =====================
  // Phase: 'onboarding' = criação do agente | 'app' = uso diário
  const [phase, setPhase] = useState<'loading' | 'onboarding' | 'app'>('loading');

  // Onboarding sub-step (only used when phase === 'onboarding')
  const [showWelcome, setShowWelcome] = useState(true);

  // Prompt stored in memory after loading from DB
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiaChatOpen, setIsLiaChatOpen] = useState(false);
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);

  // Socket for metrics
  const { socket } = useSocket();
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    newContacts: 0,
    activeChats: 0
  });

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
    { id: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: 'google_calendar', connected: false },
  ];

  // =====================
  // INITIALIZATION EFFECT
  // =====================
  useEffect(() => {
    const initialize = async () => {
      if (!user) return;

      // Check if user has a prompt (completed onboarding)
      if (user.hasPrompt) {
        console.log("✅ User has prompt, loading from database...");
        try {
          const result = await promptService.getPrompt();
          if (result.success && result.prompt) {
            setAgentPrompt(result.prompt);
            setShowWelcome(false); // Ensure sidebar is visible
            setPhase('app'); // Skip to main app
            console.log("✅ Prompt loaded, entering app phase");
            return;
          }
        } catch (error) {
          console.error("Error loading prompt:", error);
        }
      }

      // No prompt = start onboarding
      console.log("📝 No prompt found, starting onboarding");
      setPhase('onboarding');
    };

    initialize();
  }, [user?.hasPrompt, user?.uid]);

  // =====================
  // SOCKET METRICS
  // =====================
  useEffect(() => {
    if (!socket) return;
    socket.on('metrics-update', (newMetrics: typeof metrics) => {
      setMetrics(newMetrics);
    });
    socket.emit('request-metrics');
    return () => {
      socket.off('metrics-update');
    };
  }, [socket]);

  // =====================
  // PREVENT BACK BUTTON
  // =====================
  useEffect(() => {
    if (phase !== 'app') return;

    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [phase]);

  // =====================
  // HANDLERS
  // =====================
  const handleLogout = async () => {
    try {
      logout();
      localStorage.removeItem('dashboard_state'); // Clear old state
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

  const handleOnboardingComplete = (prompt: string) => {
    console.log("✅ Onboarding complete, entering app phase");
    setAgentPrompt(prompt);
    setPhase('app');
  };

  // =====================
  // LOADING STATE
  // =====================
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  // =====================
  // RENDER
  // =====================
  return (
    <>
      <AnimatePresence mode="wait">
        {/* PHASE: ONBOARDING */}
        {phase === 'onboarding' && (
          showWelcome ? (
            <WelcomeScreen
              key="welcome"
              onStart={() => setShowWelcome(false)}
            />
          ) : (
            <AgentCreator
              key="creator"
              isExiting={false}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onOpenIntegrations={handleOpenIntegrations}
              onStartChat={handleOnboardingComplete}
            />
          )
        )}

        {/* PHASE: APP (Main Dashboard) */}
        {phase === 'app' && (
          <div
            key="dashboard"
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-gradient-to-b from-[#020617] via-[#0f0a29] to-[#1a0a2e]"
          >
            {/* Hamburger Menu Button */}
            <div className="fixed top-4 left-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-white/70 hover:bg-white/10"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>

            {/* Dashboard Content (Metrics) */}
            <DashboardStep
              integrations={integrations}
              onOpenIntegrations={handleOpenIntegrations}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ===================== */}
      {/* PERSISTENT COMPONENTS */}
      {/* ===================== */}

      {/* Sidebar - Always available after welcome screen */}
      {!showWelcome && (
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onClose={() => { setIsSidebarOpen(false); setShouldExpandIntegrations(false); }}
          onNavigate={() => { }} // Navigation handled by router
          currentPage="dashboard"
          integrations={integrations}
          onLogout={handleLogout}
          forceExpandIntegrations={shouldExpandIntegrations}
          onIntegrationDisconnect={(id) => {
            if (id === 'whatsapp' && whatsappInstances.length > 0) {
              handleDisconnect();
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
          onOpenLiaChat={() => setIsLiaChatOpen(true)}
        />
      )}

      {/* WhatsApp Modal */}
      <WhatsAppConnectionModal
        isOpen={whatsappModalState.isOpen}
        onClose={closeWhatsappModal}
        modalState={whatsappModalState}
        instance={whatsappInstances[0]}
        onGenerateQR={handleGenerateQR}
        onDisconnect={handleDisconnect}
      />

      {/* Lia Chat Sidebar - Always available */}
      <LiaSidebar
        isOpen={isLiaChatOpen}
        onClose={() => setIsLiaChatOpen(false)}
        metrics={metrics}
      />

      {/* Floating Lia Button - Always visible after onboarding */}
      {!showWelcome && phase === 'app' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          onClick={() => setIsLiaChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform z-30 group"
        >
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />

          {/* Avatar */}
          <span className="relative z-10 font-bold text-2xl">L</span>

          {/* Tooltip */}
          <div className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-white/10">
            Falar com a Lia
          </div>
        </motion.button>
      )}
    </>
  );
};

export default Dashboard;

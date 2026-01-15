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
  const googleCalendarUserId = localStorage.getItem('userEmail') || user?.email || currentSessionId || 'default-user';

  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  useEffect(() => {
    const checkGoogleCalendarStatus = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
        const response = await fetch(`${backendUrl}/api/google-calendar/status?userId=${encodeURIComponent(googleCalendarUserId)}`);
        const data = await response.json();
        if (data.success && data.isConnected) {
          setIsGoogleCalendarConnected(true);
        }
      } catch (e) {
        console.error("Failed to check Google Calendar status", e);
      }
    };
    checkGoogleCalendarStatus();
  }, [googleCalendarUserId]);

  const integrations: Integration[] = [
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: 'whatsapp', connected: isWhatsAppConnected },
    { id: 'google_calendar', name: 'Google Calendar', color: '#4285F4', icon: 'google_calendar', connected: isGoogleCalendarConnected },
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
          onIntegrationDisconnect={async (id) => {
            if (id === 'whatsapp' && whatsappInstances.length > 0) {
              handleDisconnect();
            } else if (id === 'google_calendar') {
              try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
                const response = await fetch(`${backendUrl}/api/google-calendar/disconnect`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: googleCalendarUserId })
                });
                const data = await response.json();

                if (data.success) {
                  setIsGoogleCalendarConnected(false);
                  toast({
                    title: "Desconectado",
                    description: "Google Calendar desconectado com sucesso.",
                  });
                } else {
                  throw new Error(data.error || 'Erro ao desconectar');
                }
              } catch (error) {
                console.error('Falha ao desconectar Google Calendar:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível desconectar o Google Calendar.",
                  variant: "destructive"
                });
              }
            }
          }}
          sessionId={currentSessionId}
          onIntegrationClick={async (id) => {
            if (id === 'whatsapp') {
              if (!isWhatsAppConnected) {
                handleGenerateQR(1);
              }
            } else if (id === 'google_calendar') {
              // Conectar Google Calendar via OAuth popup
              try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
                // Try to get identifier from multiple sources: localStorage, auth context, or session ID
                const userEmail = localStorage.getItem('userEmail') || user?.email || currentSessionId || 'user_' + Math.random().toString(36).substring(7);

                if (!userEmail) {
                  throw new Error('User identifier not found');
                }

                console.log('🔗 Initiating Google Calendar auth for:', userEmail);

                const response = await fetch(`${backendUrl}/api/google-calendar/auth-url?userId=${encodeURIComponent(userEmail)}`);
                const data = await response.json();

                if (data.success && data.authUrl) {
                  // Abrir popup OAuth
                  const popup = window.open(
                    data.authUrl,
                    'Google Calendar Auth',
                    'width=600,height=700,scrollbars=yes'
                  );

                  // Listener para quando o popup fechar
                  const handleMessage = (event: MessageEvent) => {
                    if (event.data?.type === 'google-calendar-connected' && event.data?.success) {
                      toast({
                        title: "Google Calendar Conectado!",
                        description: "Seu agente agora pode gerenciar sua agenda.",
                        className: "bg-emerald-500 text-white border-0"
                      });
                      window.removeEventListener('message', handleMessage);
                      clearInterval(checkPopup);
                    }
                  };

                  window.addEventListener('message', handleMessage);

                  // Polling mais robusto: verificar se o popup fechou OU se a conexão já foi ativada backend-side
                  const checkPopup = setInterval(async () => {
                    // 1. Verificar se fechou manualmente
                    if (popup?.closed) {
                      clearInterval(checkPopup);
                      window.removeEventListener('message', handleMessage);
                      return;
                    }

                    // 2. Verificar no backend se já conectou
                    try {
                      const statusRes = await fetch(`${backendUrl}/api/google-calendar/status?userId=${encodeURIComponent(userEmail)}`);
                      const statusData = await statusRes.json();

                      if (statusData.success && statusData.isConnected) {
                        console.log("✅ Conexão detectada via polling!");
                        setIsGoogleCalendarConnected(true); // Atualiza estado visual
                        popup?.close();
                        clearInterval(checkPopup);
                        window.removeEventListener('message', handleMessage);

                        toast({
                          title: "Google Calendar Conectado!",
                          description: "Integração realizada com sucesso.",
                          className: "bg-emerald-500 text-white border-0"
                        });
                      }
                    } catch (e) {
                      // Silenciar erros de rede durante polling
                    }
                  }, 2000);
                } else {
                  throw new Error(data.error || 'Erro ao obter URL de autenticação');
                }
              } catch (error) {
                console.error('Google Calendar auth error:', error);
                toast({
                  title: "Erro",
                  description: error instanceof Error ? error.message : "Não foi possível conectar ao Google Calendar.",
                  variant: "destructive"
                });
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

      {/* Floating Lia Button - Always visible after onboarding, hides when chat is open */}
      {!showWelcome && phase === 'app' && !isLiaChatOpen && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
          {/* Message Popup */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.5, type: 'spring', damping: 20 }}
            className="pointer-events-auto bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-2xl rounded-br-sm shadow-2xl max-w-[280px] relative group cursor-pointer hover:bg-slate-900/60 transition-colors"
            onClick={() => setIsLiaChatOpen(true)}
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <span className="text-lg">👩‍💻</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/90 leading-snug font-medium">
                  Psiu! Caso queira saber mais métricas, me chame aqui e eu te conto tudo...
                </p>
              </div>
            </div>
          </motion.div>

          {/* New Premium Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLiaChatOpen(true)}
            className="pointer-events-auto relative w-16 h-16 group outline-none"
          >
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md group-hover:bg-emerald-400/50 transition-colors duration-500" />

            {/* Rotating Border */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-transparent p-[2px] animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100" />

            {/* Main Circle */}
            <div className="absolute inset-[2px] rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
              {/* Inner Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />

              {/* L Icon */}
              <span className="relative z-10 font-bold text-3xl bg-gradient-to-br from-white to-emerald-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                L
              </span>
            </div>

            {/* Online Dot */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </motion.button>
        </div>
      )}
    </>
  );
};

export default Dashboard;

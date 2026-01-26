import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useToast } from '@/hooks/use-toast';
import DashboardSidebar from './DashboardSidebar';
import LiaSidebar from './LiaSidebar';
import WhatsAppConnectionModal from './WhatsAppConnectionModal';
import { LiaFloatingButton } from './LiaFloatingButton';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';

interface LayoutProps {
  children: ReactNode;
  currentPage: "dashboard" | "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings" | "my-prompt";
  showLiaButton?: boolean;
  expandIntegrations?: boolean;
  onExpandIntegrationsChange?: (expanded: boolean) => void;
}

const Layout = ({
  children,
  currentPage,
  showLiaButton = true,
  expandIntegrations = false,
  onExpandIntegrationsChange
}: LayoutProps) => {
  const navigate = useNavigate();
  const { logout, user, updateUserApiKeyStatus } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();

  // Sidebar and Lia state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiaChatOpen, setIsLiaChatOpen] = useState(false);
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);

  // API Key Check State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // Sync external prop with internal state
  useEffect(() => {
    if (expandIntegrations) {
      setIsSidebarOpen(true);
      setShouldExpandIntegrations(true);
    }
  }, [expandIntegrations]);

  // Handle closing side effects
  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    setShouldExpandIntegrations(false);
    onExpandIntegrationsChange?.(false);
  };

  // Integrations state
  const {
    integrations,
    whatsappModalState,
    closeWhatsappModal,
    handleGenerateQR,
    handleWhatsappDisconnect,
    whatsappInstance,
    currentSessionId,
    handleIntegrationClick,
    handleIntegrationDisconnect
  } = useIntegrations();

  // Metrics for Lia sidebar
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    newContacts: 0,
    activeChats: 0
  });

  // Socket metrics listener
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

  const handleLogout = async () => {
    try {
      logout();
      localStorage.removeItem('dashboard_state');
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleApiKeyComplete = () => {
    setIsApiKeyModalOpen(false);
    updateUserApiKeyStatus(true);
  };

  // Global API Key Check
  useEffect(() => {
    const checkApiKey = async () => {
      // Optimization: If AuthContext already has the info, skip fetch
      if (user) {
        if (user.hasGeminiApiKey) {
          setVerificationLoading(false);
          return;
        } else if (user.hasGeminiApiKey === false) {
          setVerificationLoading(false);
          setIsApiKeyModalOpen(true);
          return;
        }
      }

      // Fallback: Fetch if user context didn't have definitive answer
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setVerificationLoading(false);
          return;
        }

        const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';

        const response = await fetch(`${backendUrl}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && !data.user.hasGeminiApiKey) {
            setIsApiKeyModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error checking API key status:", error);
      } finally {
        setVerificationLoading(false);
      }
    };

    checkApiKey();
  }, [user]);

  if (verificationLoading) {
    // Loading State
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-[#00A947] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-lg font-medium text-slate-300">Verificando Credenciais...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Persistent Components */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onNavigate={() => { }} // Navigation handled by router internally in Sidebar
        currentPage={currentPage}
        integrations={integrations}
        onLogout={handleLogout}
        forceExpandIntegrations={shouldExpandIntegrations}
        onIntegrationClick={handleIntegrationClick}
        onIntegrationDisconnect={handleIntegrationDisconnect}
        sessionId={currentSessionId}
        onOpenLiaChat={() => setIsLiaChatOpen(true)}
      />

      <WhatsAppConnectionModal
        isOpen={whatsappModalState.isOpen}
        onClose={closeWhatsappModal}
        modalState={whatsappModalState}
        instance={whatsappInstance}
        onGenerateQR={handleGenerateQR}
        onDisconnect={handleWhatsappDisconnect}
      />

      <LiaSidebar
        isOpen={isLiaChatOpen}
        onClose={() => setIsLiaChatOpen(false)}
        metrics={metrics}
      />

      <ApiKeyModal
        open={isApiKeyModalOpen}
        onComplete={handleApiKeyComplete}
      />

      {showLiaButton && !isLiaChatOpen && (
        <LiaFloatingButton
          onClick={() => setIsLiaChatOpen(true)}
          message={currentPage === 'dashboard' ? "Psiu! Caso queira saber mais métricas, me chame aqui e eu te conto tudo..." : undefined}
        />
      )}
    </div>
  );
};

export default Layout;

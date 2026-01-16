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

interface LayoutProps {
  children: ReactNode;
  currentPage: "dashboard" | "chat" | "connections" | "integrations" | "ai-status" | "calendar" | "settings" | "my-prompt";
  showLiaButton?: boolean;
}

const Layout = ({ children, currentPage, showLiaButton = true }: LayoutProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { socket } = useSocket();

  // Sidebar and Lia state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiaChatOpen, setIsLiaChatOpen] = useState(false);
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);

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
        onClose={() => { setIsSidebarOpen(false); setShouldExpandIntegrations(false); }}
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

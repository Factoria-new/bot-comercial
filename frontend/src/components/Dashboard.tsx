import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AgentCreator from '@/components/AgentCreator';
import WelcomeScreen from '@/components/WelcomeScreen';
import FactoriaChatInterface from '@/components/ui/factoria-chat-interface';
import DashboardSidebar from '@/components/DashboardSidebar';
import { AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [agentCreated, setAgentCreated] = useState(false); // Kept for legacy compatibility if needed
  const [showWelcome, setShowWelcome] = useState(true); // Default to true for new flow
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);
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
    console.log('🎉 Agente criado!');
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
      title: "Agente criado!",
      description: `Seu agente para ${info.business_type} está pronto.`,
    });
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
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={() => { }}
        currentPage="chat"
        integrations={[]}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Dashboard;

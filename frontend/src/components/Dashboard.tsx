import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AgentCreator from '@/components/AgentCreator';
import WelcomeScreen from '@/components/WelcomeScreen';
import { DashboardStep } from '@/components/agent-creator/DashboardStep';
import { useIntegrations } from '@/hooks/useIntegrations';
import { promptService } from '@/services/promptService';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const { user } = useAuth();

  // Phase: 'onboarding' = criação do agente | 'app' = uso diário
  const [phase, setPhase] = useState<'loading' | 'onboarding' | 'app'>('loading');

  // Onboarding sub-step (only used when phase === 'onboarding')
  const [showWelcome, setShowWelcome] = useState(true);

  // Integrations state for DashboardStep
  const { integrations, handleIntegrationClick } = useIntegrations();

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
    <AnimatePresence mode="wait">
      {phase === 'onboarding' ? (
        showWelcome ? (
          <WelcomeScreen
            key="welcome"
            onStart={() => setShowWelcome(false)}
          />
        ) : (
          <Layout key="creator-layout" currentPage="dashboard" showLiaButton={false}>
            <AgentCreator
              key="creator"
              isExiting={false}
              onOpenSidebar={() => { }} // Layout handled
              onOpenIntegrations={() => { }} // Layout handled
              onStartChat={() => setPhase('app')}
            />
          </Layout>
        )
      ) : (
        <Layout key="dashboard-layout" currentPage="dashboard">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-gradient-to-b from-[#020617] via-[#0f0a29] to-[#1a0a2e]">
            {/* Dashboard Content (Metrics) */}
            <DashboardStep
              integrations={integrations}
              onOpenIntegrations={(id) => handleIntegrationClick(id)}
            />
          </div>
        </Layout>
      )}
    </AnimatePresence>
  );
};

export default Dashboard;

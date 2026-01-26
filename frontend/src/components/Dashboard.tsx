import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AgentCreator from '@/components/AgentCreator';
import { DashboardStep } from '@/components/agent-creator/DashboardStep';
import { useIntegrations } from '@/hooks/useIntegrations';
import { promptService } from '@/services/promptService';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import LottieLoader from '@/components/LottieLoader';

const Dashboard = () => {
  const { user, updateUserPromptStatus } = useAuth();

  // Phase: 'onboarding' = criação do agente | 'app' = uso diário
  const [phase, setPhase] = useState<'loading' | 'onboarding' | 'app'>('loading');

  // Integrations state for DashboardStep
  const { integrations } = useIntegrations();
  const [shouldExpandIntegrations, setShouldExpandIntegrations] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================
  // INITIALIZATION EFFECT
  // =====================
  useEffect(() => {
    const initialize = async () => {
      if (!user) return;

      // 1. Trust AuthContext if it says true
      if (user.hasPrompt) {
        setPhase('app'); // Skip to main app
        console.log("✅ Prompt loaded (from profile), entering app phase");
        return;
      }

      // 2. If AuthContext says false, DOUBLE CHECK with API
      // (This handles cases where login response was missing data but prompt exists)
      console.log("⚠️ user.hasPrompt is false, verifying with API...");
      try {
        const result = await promptService.getPrompt();
        if (result.success && result.prompt) {
          console.log("✅ Prompt found via API! syncing state...");
          updateUserPromptStatus?.(true); // Fix state for future
          setPhase('app');
          return;
        }
      } catch (error) {
        console.error("Error verifying prompt:", error);
      }

      // 3. Truly no prompt = start onboarding
      console.log("📝 No prompt verified, starting onboarding");
      setPhase('onboarding');
    };

    initialize();
  }, [user?.hasPrompt, user?.uid, updateUserPromptStatus]);

  // =====================
  // LOADING STATE
  // =====================
  if (phase === 'loading') {
    return <LottieLoader />;
  }

  // =====================
  // RENDER
  // =====================
  return (
    <AnimatePresence mode="wait">
      {phase === 'onboarding' ? (
        <Layout
          key="creator-layout"
          currentPage="dashboard"
          showLiaButton={false}
          showSidebarTrigger={false}
          expandIntegrations={shouldExpandIntegrations}
          onExpandIntegrationsChange={setShouldExpandIntegrations}
          sidebarOpen={sidebarOpen}
          onSidebarOpenChange={setSidebarOpen}
        >
          <AgentCreator
            key="creator"
            isExiting={false}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenIntegrations={() => {
              setSidebarOpen(true);
              setShouldExpandIntegrations(true);
            }}
            onStartChat={() => setPhase('app')}
            integrations={integrations}
          />
        </Layout>
      ) : (

        <Layout
          key="dashboard-layout"
          currentPage="dashboard"
          expandIntegrations={shouldExpandIntegrations}
          onExpandIntegrationsChange={setShouldExpandIntegrations}
        >
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-gradient-to-b from-[#020617] via-[#0f0a29] to-[#1a0a2e]">
            {/* Dashboard Content (Metrics) */}
            <DashboardStep
              integrations={integrations}
              onOpenIntegrations={() => setShouldExpandIntegrations(true)}
            />
          </div>
        </Layout >
      )}
    </AnimatePresence >
  );
};

export default Dashboard;

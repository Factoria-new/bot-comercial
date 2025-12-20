import { useState, useEffect, useCallback } from 'react';
import {
    OnboardingState,
    ChatMessage,
    INITIAL_ONBOARDING_STATE,
    BOT_MESSAGES,
    generateSalesPrompt,
} from '@/types/onboarding';

const STORAGE_KEY = 'factoria_onboarding';
const VERSION = '2.0'; // Sales-focused version

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log('🚀 useOnboarding hook loaded - Version:', VERSION);

export function useOnboarding() {
    const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // Check if it's old format (has apiKey or niche instead of segment)
                // If so, clear and start fresh
                if (parsed.apiKey !== undefined || parsed.companyInfo?.niche !== undefined) {
                    console.log('Detected old onboarding data, clearing...');
                    localStorage.removeItem(STORAGE_KEY);
                    setIsInitialized(true);
                    return;
                }

                // Convert timestamp strings back to Date objects
                parsed.messages = parsed.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }));
                setState(parsed);
            } catch (e) {
                console.error('Failed to parse onboarding state:', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state, isInitialized]);

    // Add bot message with typing animation
    const addBotMessage = useCallback(async (content: string, typingDelay = 1500) => {
        setState(prev => ({ ...prev, isTyping: true }));

        await delay(typingDelay);

        const newMessage: ChatMessage = {
            id: generateId(),
            type: 'bot',
            content,
            timestamp: new Date(),
        };

        setState(prev => ({
            ...prev,
            isTyping: false,
            messages: [...prev.messages, newMessage],
        }));
    }, []);

    // Add user message
    const addUserMessage = useCallback((content: string) => {
        const newMessage: ChatMessage = {
            id: generateId(),
            type: 'user',
            content,
            timestamp: new Date(),
        };

        setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
        }));
    }, []);

    // Start onboarding flow
    const startOnboarding = useCallback(async () => {
        if (state.messages.length === 0) {
            await addBotMessage(BOT_MESSAGES['welcome'], 2000);
            await delay(500);
            await addBotMessage(BOT_MESSAGES['company-name'], 1500);
            setState(prev => ({ ...prev, step: 'company-name' }));
        }
    }, [state.messages.length, addBotMessage]);

    // Handle user input based on current step
    const handleUserInput = useCallback(async (input: string) => {
        addUserMessage(input);

        await delay(300);

        // Post-onboarding commands
        if (state.step === 'completed') {
            const lowerInput = input.toLowerCase();

            if (lowerInput.includes('ajuda') || lowerInput.includes('help')) {
                await addBotMessage(`Posso te ajudar com:\n\n• **\"editar empresa\"** - Alterar informações da empresa\n• **\"ver prompt\"** - Ver o prompt do agente\n• **\"métricas\"** - Ver estatísticas\n• **\"status\"** - Ver status das integrações\n• Ou pergunte qualquer coisa!`, 1500);
                return;
            }

            if (lowerInput.includes('ver prompt') || lowerInput.includes('meu prompt')) {
                if (state.agentConfig?.prompt) {
                    await addBotMessage(`📝 **Seu prompt de vendas:**\n\n${state.agentConfig.prompt.substring(0, 500)}...\n\n_Para ver o prompt completo, acesse as configurações._`, 1500);
                } else {
                    await addBotMessage('Ainda não há um prompt configurado. Complete o onboarding primeiro!', 1000);
                }
                return;
            }

            if (lowerInput.includes('métrica') || lowerInput.includes('metricas')) {
                const connected = state.integrations.filter(i => i.connected);
                await addBotMessage(`📊 **Métricas do seu agente:**\n\n• Empresa: ${state.companyInfo.name}\n• Segmento: ${state.companyInfo.segment}\n• Integrações ativas: ${connected.length}\n• Plataformas: ${connected.map(i => i.name).join(', ') || 'Nenhuma'}\n\n_Métricas detalhadas em breve!_`, 1500);
                return;
            }

            if (lowerInput.includes('status')) {
                const connected = state.integrations.filter(i => i.connected);
                const notConnected = state.integrations.filter(i => !i.connected);
                await addBotMessage(`✅ **Conectadas:** ${connected.map(i => i.name).join(', ') || 'Nenhuma'}\n\n❌ **Pendentes:** ${notConnected.map(i => i.name).join(', ') || 'Todas conectadas!'}`, 1500);
                return;
            }

            // Generic response
            await addBotMessage(`Seu agente de vendas para **${state.companyInfo.name}** está configurado e pronto! Digite **"ajuda"** para ver os comandos disponíveis. 🚀`, 1500);
            return;
        }

        // Handle each step
        switch (state.step) {
            case 'company-name':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, name: input.trim() },
                }));
                await addBotMessage(`Prazer, **${input.trim()}**! 🤝`, 1000);
                await addBotMessage(BOT_MESSAGES['company-segment'], 1200);
                setState(prev => ({ ...prev, step: 'company-segment' }));
                break;

            case 'company-segment':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, segment: input.trim() },
                }));
                await addBotMessage(`${input.trim()}, interessante! 💡`, 1000);
                await addBotMessage(BOT_MESSAGES['company-products'], 1200);
                setState(prev => ({ ...prev, step: 'company-products' }));
                break;

            case 'company-products':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, products: input.trim() },
                }));
                await addBotMessage('Ótimo, entendi seus produtos! 📦', 1000);
                await addBotMessage(BOT_MESSAGES['company-prices'], 1200);
                setState(prev => ({ ...prev, step: 'company-prices' }));
                break;

            case 'company-prices':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, prices: input.trim() },
                }));
                await addBotMessage('Anotado! 💰', 1000);
                await addBotMessage(BOT_MESSAGES['company-differentials'], 1200);
                setState(prev => ({ ...prev, step: 'company-differentials' }));
                break;

            case 'company-differentials':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, differentials: input.trim() },
                }));
                await addBotMessage('Que diferenciais incríveis! ⭐', 1000);
                await addBotMessage(BOT_MESSAGES['company-tone'], 1200);
                setState(prev => ({ ...prev, step: 'company-tone' }));
                break;

            case 'company-tone':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, tone: input.trim() },
                }));
                console.log('📝 Step 6/7 - Tom de comunicação:', input.trim());
                await addBotMessage('Perfeito, vou lembrar disso! 🎯', 1000);
                await addBotMessage(BOT_MESSAGES['company-contact'], 1200);
                setState(prev => ({ ...prev, step: 'company-contact' }));
                break;

            case 'company-contact':
                const updatedInfo = { ...state.companyInfo, contact: input.trim() };
                console.log('📝 Step 7/7 - Contato:', input.trim());
                console.log('📦 Informações coletadas:', updatedInfo);

                setState(prev => ({
                    ...prev,
                    companyInfo: updatedInfo,
                    step: 'generating-agent',
                }));

                await addBotMessage(BOT_MESSAGES['generating-agent'], 1000);

                // Generate the sales prompt
                console.log('🔄 Gerando prompt de vendas...');
                await delay(2500);

                const salesPrompt = generateSalesPrompt(updatedInfo);

                console.log('✅ PROMPT DE VENDAS GERADO:');
                console.log('='.repeat(50));
                console.log(salesPrompt);
                console.log('='.repeat(50));
                console.log('📊 Este prompt será usado pelo Gemini para atender clientes via WhatsApp');
                console.log('🔑 API Key do Gemini será lida do .env (API_GEMINI)');

                setState(prev => ({
                    ...prev,
                    agentCreated: true,
                    agentConfig: {
                        prompt: salesPrompt,
                        createdAt: new Date(),
                        companyInfo: updatedInfo,
                    },
                    step: 'completed',
                }));

                await addBotMessage(`✨ **Agente de vendas criado com sucesso!**\n\nSeu agente para a **${updatedInfo.name}** está pronto para:\n\n• 🎯 Atender clientes com tom ${updatedInfo.tone}\n• 💰 Apresentar seus produtos e preços\n• ⭐ Destacar seus diferenciais\n• 📞 Direcionar para contato quando necessário\n\nDigite **"ver prompt"** para conferir o prompt gerado ou **"ajuda"** para ver outros comandos.`, 2000);
                break;

            default:
                break;
        }
    }, [state.step, state.companyInfo, addUserMessage, addBotMessage]);

    // Connect integration (mock)
    const connectIntegration = useCallback(async (integrationId: string) => {
        setState(prev => ({ ...prev, isTyping: true }));

        await delay(1500);

        const integration = state.integrations.find(i => i.id === integrationId);

        setState(prev => ({
            ...prev,
            isTyping: false,
            integrations: prev.integrations.map(int =>
                int.id === integrationId
                    ? { ...int, connected: true, username: '@factoria_mock' }
                    : int
            ),
        }));

        await addBotMessage(`✅ ${integration?.name || 'Plataforma'} conectado com sucesso!`, 500);
    }, [state.integrations, addBotMessage]);

    // Disconnect integration (mock)
    const disconnectIntegration = useCallback((integrationId: string) => {
        setState(prev => ({
            ...prev,
            integrations: prev.integrations.map(int =>
                int.id === integrationId
                    ? { ...int, connected: false, username: undefined }
                    : int
            ),
        }));
    }, []);

    // Reset onboarding (for testing)
    const resetOnboarding = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState(INITIAL_ONBOARDING_STATE);
    }, []);

    // Check if onboarding is completed
    const isOnboardingComplete = state.step === 'completed' && state.agentCreated;
    const hasConnectedIntegrations = state.integrations.some(i => i.connected);

    return {
        state,
        isInitialized,
        isOnboardingComplete,
        hasConnectedIntegrations,
        startOnboarding,
        handleUserInput,
        connectIntegration,
        disconnectIntegration,
        resetOnboarding,
    };
}

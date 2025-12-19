import { useState, useEffect, useCallback } from 'react';
import {
    OnboardingState,
    OnboardingStep,
    ChatMessage,
    Integration,
    INITIAL_ONBOARDING_STATE,
    BOT_MESSAGES,
    DEFAULT_INTEGRATIONS,
} from '@/types/onboarding';

const STORAGE_KEY = 'factoria_onboarding';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useOnboarding() {
    const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert timestamp strings back to Date objects
                parsed.messages = parsed.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                }));
                setState(parsed);
            } catch (e) {
                console.error('Failed to parse onboarding state:', e);
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
        // Show typing indicator
        setState(prev => ({ ...prev, isTyping: true }));

        await delay(typingDelay);

        // Add the message
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
            await addBotMessage(BOT_MESSAGES['api-key'], 1500);
            setState(prev => ({ ...prev, step: 'api-key' }));
        }
    }, [state.messages.length, addBotMessage]);

    // Handle user input based on current step
    const handleUserInput = useCallback(async (input: string) => {
        addUserMessage(input);

        await delay(300);

        // Post-onboarding commands
        if (state.step === 'completed') {
            const lowerInput = input.toLowerCase();

            if (lowerInput.includes('trocar') && lowerInput.includes('api') || lowerInput.includes('alterar') && lowerInput.includes('chave')) {
                await addBotMessage('Claro! Por favor, insira sua nova chave de API do Gemini:', 1000);
                setState(prev => ({ ...prev, step: 'change-api-key' as any }));
                return;
            }

            if (lowerInput.includes('métrica') || lowerInput.includes('metricas') || lowerInput.includes('estatística') || lowerInput.includes('relatorio')) {
                const connected = state.integrations.filter(i => i.connected);
                await addBotMessage(`📊 **Métricas do seu agente:**\n\n• Integrações ativas: ${connected.length}\n• Plataformas: ${connected.map(i => i.name).join(', ') || 'Nenhuma'}\n• Empresa: ${state.companyInfo.name}\n• Nicho: ${state.companyInfo.niche}\n\n_Métricas detalhadas em breve!_`, 1500);
                return;
            }

            if (lowerInput.includes('ajuda') || lowerInput.includes('help')) {
                await addBotMessage(`Posso te ajudar com:\n\n• **"trocar api key"** - Alterar sua chave do Gemini\n• **"métricas"** - Ver estatísticas do agente\n• **"status"** - Ver status das integrações\n• Ou pergunte qualquer coisa sobre seu negócio!`, 1500);
                return;
            }

            if (lowerInput.includes('status')) {
                const connected = state.integrations.filter(i => i.connected);
                const notConnected = state.integrations.filter(i => !i.connected);
                await addBotMessage(`✅ **Conectadas:** ${connected.map(i => i.name).join(', ') || 'Nenhuma'}\n\n❌ **Pendentes:** ${notConnected.map(i => i.name).join(', ') || 'Todas conectadas!'}`, 1500);
                return;
            }

            // Generic response for other questions
            await addBotMessage(`Entendi! Assim que eu estiver conectado ao Gemini de verdade, poderei te ajudar melhor com isso. Por enquanto, estou em modo de demonstração. 🤖`, 1500);
            return;
        }

        // Handle API key change
        if ((state.step as string) === 'change-api-key') {
            if (input.trim().length > 10) {
                setState(prev => ({ ...prev, apiKey: input.trim(), step: 'completed' }));
                await addBotMessage('✅ Chave de API atualizada com sucesso!', 1000);
                await addBotMessage('Pronto para continuar te ajudando. O que precisa?', 1200);
            } else {
                await addBotMessage('❌ Chave inválida. Por favor, insira uma chave de API válida.', 1000);
            }
            return;
        }

        switch (state.step) {
            case 'api-key':
                // Mock validate API key (just check if it's not empty)
                if (input.trim().length > 10) {
                    setState(prev => ({ ...prev, apiKey: input.trim() }));
                    await addBotMessage('✅ Chave de API salva com sucesso!', 1000);
                    await addBotMessage(BOT_MESSAGES['company-name'], 1200);
                    setState(prev => ({ ...prev, step: 'company-name' }));
                } else {
                    await addBotMessage('❌ Essa não parece ser uma chave válida. Por favor, insira sua chave de API do Gemini.', 1000);
                }
                break;

            case 'company-name':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, name: input.trim() },
                }));
                await addBotMessage(`Prazer, **${input.trim()}**! 🤝`, 1000);
                await addBotMessage(BOT_MESSAGES['company-niche'], 1200);
                setState(prev => ({ ...prev, step: 'company-niche' }));
                break;

            case 'company-niche':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, niche: input.trim() },
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
                await addBotMessage('Ótimo! Isso vai ajudar muito. 📋', 1000);
                await addBotMessage(BOT_MESSAGES['company-tone'], 1200);
                setState(prev => ({ ...prev, step: 'company-tone' }));
                break;

            case 'company-tone':
                setState(prev => ({
                    ...prev,
                    companyInfo: { ...prev.companyInfo, tone: input.trim() },
                }));
                setState(prev => ({ ...prev, step: 'generating-agent' }));
                await addBotMessage(BOT_MESSAGES['generating-agent'], 1000);

                // Simulate agent creation
                await delay(3000);

                setState(prev => ({ ...prev, agentCreated: true, step: 'integrations' }));
                await addBotMessage(`✨ Agente comercial para **${state.companyInfo.name || 'sua empresa'}** criado com sucesso!`, 1500);
                await addBotMessage(BOT_MESSAGES['integrations'], 1200);
                break;

            default:
                break;
        }
    }, [state.step, state.companyInfo.name, addUserMessage, addBotMessage]);

    // Connect integration (mock)
    const connectIntegration = useCallback(async (integrationId: string) => {
        setState(prev => ({ ...prev, isTyping: true }));

        // Simulate connection delay
        await delay(1500);

        const integration = state.integrations.find(i => i.id === integrationId);

        // Update integration status
        setState(prev => ({
            ...prev,
            isTyping: false,
            integrations: prev.integrations.map(int =>
                int.id === integrationId
                    ? { ...int, connected: true, username: '@factoria_mock' }
                    : int
            ),
            step: 'completed', // Mark as completed immediately
        }));

        await addBotMessage(`✅ ${integration?.name || 'Plataforma'} conectado com sucesso!`, 500);
        await delay(800);
        await addBotMessage('🎉 Tudo pronto! Seu agente está configurado e conectado.', 1000);
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
    const isOnboardingComplete = state.step === 'completed' || state.integrations.some(i => i.connected);
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

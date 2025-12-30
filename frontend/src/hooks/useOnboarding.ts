import { useState, useEffect, useCallback, useRef } from 'react';
import {
    OnboardingState,
    ChatMessage,
    INITIAL_ONBOARDING_STATE,
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

    // Ref to always have access to current state (avoids stale closure issues)
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

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
        if (typingDelay > 0) {
            setState(prev => ({ ...prev, isTyping: true }));
            await delay(typingDelay);
        }

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
            // Filter out the persistent "Agent Created" message so it doesn't get stuck
            messages: [
                ...prev.messages.filter(m => !m.content.includes("Agente criado! Iniciando modo de teste")),
                newMessage
            ],
        }));
    }, []);

    // Static Greetings for instant load
    const GREETINGS = [
        {
            intro: "Olá! Eu sou a Lia.",
            question: "Qual é o seu nicho de atuação?",
            fullText: "Olá! Eu sou a Lia, sua especialista em criação de agentes. Estou aqui para entender o seu negócio e criar o melhor time de IA para você. Me conta, qual é o seu nicho de atuação?",
            audioUrl: "/greetings/greeting_1.wav"
        },
        {
            intro: "Oi, tudo bem? Aqui é a Lia.",
            question: "Me fala um pouco mais sobre o que você vende ou qual serviço oferece.",
            fullText: "Oi, tudo bem? Aqui é a Lia. Vamos criar algo incrível para sua empresa hoje. Pra começar, me fala um pouco mais sobre o que você vende ou qual serviço oferece.",
            audioUrl: "/greetings/greeting_2.wav"
        },
        {
            intro: "Bem-vindo! Eu sou a Lia.",
            question: "Qual é o ramo da sua empresa?",
            fullText: "Bem-vindo! Eu sou a Lia. Minha missão é transformar suas necessidades em agentes de IA eficientes. Para eu ser bem assertiva, me diz: qual é o ramo da sua empresa?",
            audioUrl: "/greetings/greeting_3.wav"
        }
    ];

    // Start onboarding flow
    const startOnboarding = useCallback(async (initialInput?: string, onChunk?: (chunk: any) => void) => {
        // Prevent double initialization if messages already exist
        if (state.messages.length > 0) return null;

        if (initialInput) {
            // CASE 1: Transition from Landing Page
            // The user already typed something. We skip the generic "Hello" to avoid
            // "two chats" feeling. We treat the initial input as the first turn.

            // 1. Add user's message immediately for visual feedback
            const userMsg: ChatMessage = {
                id: generateId(),
                type: 'user',
                content: initialInput,
                timestamp: new Date(),
            };

            setState(prev => ({
                ...prev,
                messages: [userMsg],
                step: 'interview'
            }));

            // 2. Trigger the AI to analyze this input and respond
            // We pass the input directly ensuring the AI sees it
            await handleInterviewStep(initialInput, onChunk);
            return null;

        } else {
            // CASE 2: Fresh Start (Agent auto-initiates)
            // Use STATIC GREETING for instant load
            const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

            setState(prev => ({ ...prev, step: 'interview' }));

            // Add full text to message history (for context) but UI might display animation manually first
            const newMessage: ChatMessage = {
                id: generateId(),
                type: 'bot',
                content: randomGreeting.fullText,
                timestamp: new Date(),
            };

            setState(prev => ({
                ...prev,
                messages: [...prev.messages, newMessage],
                isTyping: false
            }));

            // Return the full object for UI animation control
            return {
                audioUrl: randomGreeting.audioUrl,
                text: randomGreeting.fullText,
                intro: randomGreeting.intro,
                question: randomGreeting.question
            };
        }
    }, [state.messages.length, addBotMessage]);

    // Handle AI Interview Step
    const handleInterviewStep = async (userInput: string, onChunk?: (chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete' | 'audio', content: string }) => void) => {
        try {
            setState(prev => ({ ...prev, isTyping: true }));

            const currentMessages = stateRef.current.messages;
            const history = currentMessages.map(m => ({
                role: m.type === 'bot' ? 'model' : 'user',
                content: m.content
            }));

            if (userInput) {
                history.push({ role: 'user', content: userInput });
            }

            const response = await fetch('http://localhost:3003/api/agent/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    history: history,
                    currentSystemPrompt: stateRef.current.agentConfig?.prompt || '',
                    userId: 'user'
                })
            });

            const data = await response.json();

            setState(prev => ({ ...prev, isTyping: false }));

            if (data.success) {
                // If onChunk is provided (even though we don't stream), we can use it to pass the full result back
                // This maintains some compatibility if needed, or we just rely on state updates.
                // The prompt generation for audio will happen in AgentCreator based on the full text.

                if (data.newSystemPrompt) {
                    setState(prev => ({
                        ...prev,
                        agentCreated: true,
                        agentConfig: {
                            prompt: data.newSystemPrompt,
                            createdAt: new Date(),
                            companyInfo: prev.companyInfo,
                        },
                    }));
                }

                if (onChunk) {
                    // Pass the full content as a 'text' type
                    onChunk({ type: 'text', content: data.response });

                    // NEW: Pass audio if available
                    if (data.audio) {
                        onChunk({ type: 'audio', content: data.audio });
                    }

                    onChunk({ type: 'complete', content: '' });
                }

                const newMessage: ChatMessage = {
                    id: generateId(),
                    type: 'bot',
                    content: data.response,
                    timestamp: new Date(),
                };

                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMessage],
                    isTyping: false
                }));

            } else {
                await addBotMessage(data.response || "Tive um problema. Poderia repetir?", 1000);
            }

        } catch (error) {
            console.error('Architect error:', error);
            await addBotMessage("Tive um problema de conexão. Poderia repetir?", 1000);
        } finally {
            setState(prev => ({ ...prev, isTyping: false }));
        }
    };

    // Handle Agent Testing Step
    const handleTestStep = async (userInput: string) => {
        if (!state.agentConfig?.prompt) return;

        setState(prev => ({ ...prev, isTyping: true }));
        try {
            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    systemPrompt: state.agentConfig.prompt
                })
            });

            const data = await res.json();

            if (data.success) {
                // Add bot response to TEST chat history (needs separate history? or same?)
                // Ideally we should separate "Creator Chat" from "Agent Test Chat"
                // For now, let's append to the main chat but with a clear visual distinction or mode?
                // The requirements said: "appear test prompt now... user clicks test... user can test prompt"
                // We'll use a specific state 'testing' and render the UI differently or clear messages.
                // Let's use `testMessages` state I added earlier.

                // Note: user message is already added by handleUserInput wrapper? No, check wrapper.
                // The wrapper calls addUserMessage which adds to `messages`. 
                // We need to change that logic.

                const botMsg: ChatMessage = {
                    id: generateId(),
                    type: 'bot',
                    content: data.message,
                    timestamp: new Date()
                };

                setState(prev => ({
                    ...prev,
                    isTyping: false,
                    testMessages: [...prev.testMessages, botMsg]
                }));
            }
        } catch (error) {
            // ...
            setState(prev => ({ ...prev, isTyping: false }));
        }
    };

    // Switch to testing mode
    const startTesting = useCallback(() => {
        setState(prev => ({
            ...prev,
            step: 'testing',
            testMessages: [
                {
                    id: generateId(),
                    type: 'bot',
                    content: `🤖 O **Agente da ${prev.companyInfo.name}** foi ativado.\n\nPode falar comigo como se fosse um cliente!`,
                    timestamp: new Date()
                }
            ]
        }));
    }, []);


    // Handle user input based on current step
    const handleUserInput = useCallback(async (input: string, onChunk?: (chunk: any) => void) => {
        const currentStep = stateRef.current.step;

        if (currentStep === 'testing') {
            const newMsg: ChatMessage = {
                id: generateId(),
                type: 'user',
                content: input,
                timestamp: new Date()
            };
            setState(prev => ({
                ...prev,
                testMessages: [...prev.testMessages, newMsg]
            }));
            await handleTestStep(input);
            return;
        }

        addUserMessage(input);
        await delay(300);

        if (currentStep === 'interview') {
            await handleInterviewStep(input, onChunk);
            return;
        }

        // Keep 'completed' logic for post-creation commands if needed
        if (state.step === 'completed') {
            // ... existing commands help logic ...
            if (input.toLowerCase().includes('testar')) {
                startTesting();
                return;
            }
        }

    }, [state.step, state.companyInfo, addUserMessage, addBotMessage, state.agentConfig]);

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
        setIsInitialized(false);
        setTimeout(() => {
            setIsInitialized(true);
            setState(INITIAL_ONBOARDING_STATE); // Force reset
        }, 100);
    }, []);

    // Check if onboarding is completed
    const isOnboardingComplete = state.step === 'completed' && state.agentCreated;
    const hasConnectedIntegrations = state.integrations.some(i => i.connected);

    // Manually set agent prompt (e.g. from file upload)
    const setAgentPrompt = useCallback((prompt: string) => {
        setState(prev => ({
            ...prev,
            agentCreated: true,
            agentConfig: {
                ...prev.agentConfig,
                prompt: prompt,
                createdAt: new Date(),
                companyInfo: prev.companyInfo || { name: 'Uploaded Agent', niche: 'custom' }
            }
        }));
    }, []);

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
        startTesting,
        setAgentPrompt, // New export
        addBotMessage,   // Exported for manual message injection
        addUserMessage,  // Exported for manual message injection
        sendMessageToLia: handleInterviewStep // Exported to force Architect communication (e.g. for adjustments)
    };
}

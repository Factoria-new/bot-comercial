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
            messages: [...prev.messages, newMessage],
        }));
    }, []);

    // Start onboarding flow
    const startOnboarding = useCallback(async (initialInput?: string, onChunk?: (chunk: any) => void) => {
        // Prevent double initialization if messages already exist
        if (state.messages.length > 0) return;

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

        } else {
            // CASE 2: Fresh Start (Agent auto-initiates)
            // No hardcoded messages - let the API generate the first message
            setState(prev => ({ ...prev, step: 'interview' }));
            await handleInterviewStep('', onChunk); // Agent starts the conversation
        }
    }, [state.messages.length, addBotMessage]);

    // Handle AI Interview Step
    const handleInterviewStep = async (userInput: string, onChunk?: (chunk: { type: 'text' | 'prompt' | 'error' | 'complete', content: string }) => void) => {
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
                    userId: 'user',
                    stream: !!onChunk
                })
            });

            if (onChunk && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = "";

                setState(prev => ({ ...prev, isTyping: false }));

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));

                                if (data.type === 'text') {
                                    fullText += data.content;
                                    onChunk(data);
                                } else if (data.type === 'prompt') {
                                    console.log('🧠 [Architect] Novo prompt recebido via stream!');
                                    onChunk(data); // Pass through so AgentCreator can handle it
                                    setState(prev => ({
                                        ...prev,
                                        agentCreated: true,
                                        agentConfig: {
                                            prompt: data.content,
                                            createdAt: new Date(),
                                            companyInfo: prev.companyInfo,
                                        },
                                    }));
                                } else if (data.type === 'error') {
                                    onChunk(data);
                                }
                            } catch (e) {
                                console.error("Error parsing SSE chunk:", e);
                            }
                        }
                    }
                }

                // AFTER streaming is complete, add the FULL message to the official history
                if (fullText.trim()) {
                    const newMessage: ChatMessage = {
                        id: generateId(),
                        type: 'bot',
                        content: fullText.trim(),
                        timestamp: new Date(),
                    };
                    setState(prev => ({
                        ...prev,
                        messages: [...prev.messages, newMessage]
                    }));
                }

                // Signal stream completion to AgentCreator
                if (onChunk) {
                    onChunk({ type: 'complete', content: '' });
                }

                return;
            }

            // Fallback for non-streaming
            const data = await response.json();
            if (data.success) {
                await addBotMessage(data.response, 500);
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
                    await delay(500);
                    await addBotMessage("Você pode **testar seu agente** agora mesmo! Clique em 'Testar Agente' ou continue refinando.", 500);
                }
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
        startTesting // Exposed for UI button
    };
}

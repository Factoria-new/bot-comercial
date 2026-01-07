// Basic types for the Agent Creator module

export interface AgentCreatorProps {
    onOpenSidebar?: () => void;
    onOpenIntegrations?: () => void;
    isExiting?: boolean;
    onStartChat?: (prompt: string) => void;
}

export type ChatMode = 'lia' | 'agent';

export type CreatorStep = 'chat' | 'integrations' | 'dashboard';

export interface AgentMessage {
    id: string;
    type: 'bot' | 'user';
    content: string;
}

export interface Integration {
    id: string;
    name: string;
    color: string;
    connected: boolean;
}

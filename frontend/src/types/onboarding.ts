// Onboarding Types - All mocked for now

export type OnboardingStep =
    | 'welcome'
    | 'api-key'
    | 'company-name'
    | 'company-niche'
    | 'company-products'
    | 'company-tone'
    | 'generating-agent'
    | 'integrations'
    | 'completed';

export interface ChatMessage {
    id: string;
    type: 'bot' | 'user';
    content: string;
    timestamp: Date;
    isTyping?: boolean;
}

export interface CompanyInfo {
    name: string;
    niche: string;
    products: string;
    tone: string;
}

export interface Integration {
    id: string;
    name: string;
    icon: 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'twitter';
    color: string;
    connected: boolean;
    username?: string;
}

export interface OnboardingState {
    step: OnboardingStep;
    apiKey: string | null;
    companyInfo: CompanyInfo;
    messages: ChatMessage[];
    integrations: Integration[];
    isTyping: boolean;
    agentCreated: boolean;
}

export const DEFAULT_INTEGRATIONS: Integration[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366', connected: false },
    { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E4405F', connected: false },
    { id: 'tiktok', name: 'TikTok', icon: 'tiktok', color: '#000000', connected: false },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2', connected: false },
    { id: 'twitter', name: 'Twitter / X', icon: 'twitter', color: '#1DA1F2', connected: false },
];

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
    step: 'welcome',
    apiKey: null,
    companyInfo: {
        name: '',
        niche: '',
        products: '',
        tone: '',
    },
    messages: [],
    integrations: DEFAULT_INTEGRATIONS,
    isTyping: false,
    agentCreated: false,
};

export const BOT_MESSAGES: Record<OnboardingStep, string> = {
    'welcome': 'Olá! 👋 Sou a assistente da Factoria e vou te ajudar a configurar seu agente comercial personalizado.',
    'api-key': 'Para começar, preciso da sua **chave de API do Google Gemini**. Você pode obtê-la em aistudio.google.com',
    'company-name': 'Perfeito! Agora me conta, qual o **nome da sua empresa**?',
    'company-niche': 'Legal! E em qual **nicho ou segmento** sua empresa atua?',
    'company-products': 'Entendi! Quais são os **principais produtos ou serviços** que você oferece?',
    'company-tone': 'Por último, como você gostaria que eu me comunicasse com seus clientes? (ex: formal, casual, amigável, profissional)',
    'generating-agent': 'Perfeito! 🎯 Estou criando seu agente comercial personalizado...',
    'integrations': 'Seu agente está pronto! 🚀 Agora escolha as plataformas que deseja conectar:',
    'completed': 'Tudo configurado! Seu agente comercial está pronto para atender seus clientes.',
};

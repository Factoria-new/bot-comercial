// Onboarding Types - Sales Agent Focus

export type OnboardingStep =
    | 'welcome'
    | 'interview' // New AI-driven interview step
    | 'testing'   // New Testing step
    | 'company-name'
    | 'company-segment'
    | 'company-products'
    | 'company-prices'
    | 'company-differentials'
    | 'company-tone'
    | 'company-contact'
    | 'generating-agent'
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
    segment: string;
    products: string;
    prices: string;
    differentials: string;
    tone: string;
    contact: string;
}

export interface Integration {
    id: string;
    name: string;
    icon: 'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'twitter';
    color: string;
    connected: boolean;
    username?: string;
}

export interface AgentConfig {
    prompt: string;
    createdAt: Date;
    companyInfo: CompanyInfo;
}

export interface OnboardingState {
    step: OnboardingStep;
    companyInfo: CompanyInfo;
    messages: ChatMessage[];
    testMessages: ChatMessage[]; // Messages for the "Test Mode"
    integrations: Integration[];
    isTyping: boolean;
    agentCreated: boolean;
    agentConfig: AgentConfig | null;
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
    companyInfo: {
        name: '',
        segment: '',
        products: '',
        prices: '',
        differentials: '',
        tone: '',
        contact: '',
    },
    messages: [],
    testMessages: [],
    integrations: DEFAULT_INTEGRATIONS,
    isTyping: false,
    agentCreated: false,
    agentConfig: null,
};

export const BOT_MESSAGES: Record<OnboardingStep, string> = {
    'welcome': 'Olá! 👋 Sou a assistente da Factoria e vou te ajudar a criar seu **agente de vendas personalizado**.',
    'interview': 'Vamos conversar sobre o seu negócio para eu configurar tudo certinho.',
    'testing': 'Agora você pode testar seu agente! Mande uma mensagem como se fosse um cliente.',
    'company-name': 'Para começar, me conta: qual é o **nome da sua empresa ou marca**?',
    'company-segment': 'Legal! E em qual **segmento** sua empresa atua? (ex: moda, tecnologia, alimentos, serviços...)',
    'company-products': 'Agora me conta com detalhes: quais são os **produtos ou serviços** que você vende?',
    'company-prices': 'Quais são os **preços** dos seus produtos/serviços? (pode me passar uma faixa de valores ou tabela)',
    'company-differentials': 'O que torna sua empresa **especial**? Quais são os diferenciais que fazem vocês se destacarem?',
    'company-tone': 'Como você quer que eu **converse** com seus clientes? (ex: formal e profissional, amigável e descontraído, direto e objetivo)',
    'company-contact': 'Por último, qual o **telefone, email ou WhatsApp** para contato com clientes?',
    'generating-agent': '🎯 Perfeito! Estou criando seu agente de vendas personalizado...',
    'completed': '🚀 Seu agente de vendas está pronto e configurado para atender seus clientes!',
};



// Onboarding Types - Sales Agent Focus

export type OnboardingStep =
    | 'welcome'
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
    integrations: DEFAULT_INTEGRATIONS,
    isTyping: false,
    agentCreated: false,
    agentConfig: null,
};

export const BOT_MESSAGES: Record<OnboardingStep, string> = {
    'welcome': 'Olá! 👋 Sou a assistente da Factoria e vou te ajudar a criar seu **agente de vendas personalizado**.',
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

// Generate sales-focused prompt
export function generateSalesPrompt(companyInfo: CompanyInfo): string {
    return `Você é o assistente de vendas da **${companyInfo.name}**.

## SOBRE A EMPRESA
- **Empresa:** ${companyInfo.name}
- **Segmento:** ${companyInfo.segment}
- **Produtos/Serviços:** ${companyInfo.products}
- **Preços:** ${companyInfo.prices}
- **Diferenciais:** ${companyInfo.differentials}
- **Contato:** ${companyInfo.contact}

## SEU PAPEL
Você é um vendedor experiente, persuasivo e focado em resultados. Sua comunicação deve ser **${companyInfo.tone}**.

## OBJETIVOS
1. **Acolher** o cliente de forma calorosa e profissional
2. **Entender** as necessidades e dores do cliente
3. **Apresentar** os produtos/serviços que melhor atendem
4. **Destacar** os diferenciais da empresa
5. **Conduzir** a conversa para o fechamento da venda
6. **Fornecer** informações de contato quando solicitado

## DIRETRIZES DE VENDAS
- Seja proativo: sugira produtos baseado nas necessidades do cliente
- Responda dúvidas sobre preços de forma clara e objetiva
- Use gatilhos de urgência e escassez quando apropriado
- Sempre tente avançar a conversa para o próximo passo
- Se o cliente hesitar, ofereça alternativas ou benefícios extras
- Finalize sempre com um CTA (call-to-action) claro

## REGRAS IMPORTANTES
- NUNCA invente informações sobre produtos ou preços que não foram fornecidos
- Se não souber responder algo, direcione para o contato: ${companyInfo.contact}
- Mantenha as respostas concisas e diretas
- Use emojis com moderação para criar conexão`;
}

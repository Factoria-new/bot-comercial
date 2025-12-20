"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Loader2,
    Check,
    Sparkles,
    Store,
    Utensils,
    ShoppingBag,
    ShoppingCart,
    Building2,
    Heart,
    GraduationCap,
    Scale,
    Coffee,
    Dumbbell,
    Palette,
    Scissors,
    Menu,
} from "lucide-react";
import API_CONFIG from "@/config/api";

interface DetectedTag {
    text: string;
    type: 'price' | 'payment' | 'integration' | 'product';
}

interface ExtractedInfo {
    business_type: string;
    business_name: string | null;
    products: { name: string; price: string }[];
    payment_methods: string[];
    integrations: string[];
    tone: string;
    detected_tags: DetectedTag[];
}

interface AgentCreatorProps {
    onAgentCreated?: (prompt: string, info: ExtractedInfo) => void;
    onOpenSidebar?: () => void;
}

const BUSINESS_CATEGORIES = [
    { id: 'barbearia', label: 'Barbearia', icon: Scissors, color: '#3B82F6' },
    { id: 'restaurante', label: 'Restaurante', icon: Utensils, color: '#EF4444' },
    { id: 'loja', label: 'Loja', icon: Store, color: '#10B981' },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, color: '#8B5CF6' },
    { id: 'imobiliaria', label: 'Imobiliária', icon: Building2, color: '#F59E0B' },
    { id: 'consultorio', label: 'Consultório', icon: Heart, color: '#EC4899' },
    { id: 'escola', label: 'Escola', icon: GraduationCap, color: '#06B6D4' },
    { id: 'advocacia', label: 'Advocacia', icon: Scale, color: '#6366F1' },
    { id: 'cafeteria', label: 'Cafeteria', icon: Coffee, color: '#78350F' },
    { id: 'academia', label: 'Academia', icon: Dumbbell, color: '#DC2626' },
    { id: 'design', label: 'Design', icon: Palette, color: '#9333EA' },
];

export default function AgentCreator({ onAgentCreated, onOpenSidebar }: AgentCreatorProps) {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'input' | 'processing' | 'done'>('input');
    const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Configurando ferramentas...");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [prompt]);

    const handleCategoryClick = (categoryId: string) => {
        const templates: Record<string, string> = {
            barbearia: 'Crie um agente para minha barbearia que agende horários, mostre serviços (corte R$35, barba R$25, combo R$50) e aceite Pix',
            restaurante: 'Crie um agente para meu restaurante que apresente o cardápio, faça pedidos, colete endereço para delivery e aceite cartão',
            loja: 'Crie um agente para minha loja que apresente produtos, tire dúvidas, mostre preços e aceite pagamento via Pix',
            ecommerce: 'Crie um agente para meu e-commerce que tire dúvidas sobre produtos, informe sobre frete e direcione para compra no site',
            imobiliaria: 'Crie um agente para minha imobiliária que apresente imóveis disponíveis, agende visitas e capture dados de leads',
            consultorio: 'Crie um agente para meu consultório que informe sobre procedimentos, valores de consulta (R$200) e agende horários',
            escola: 'Crie um agente para minha escola/curso que informe sobre turmas, valores mensais e faça matrículas',
            advocacia: 'Crie um agente para meu escritório de advocacia que tire dúvidas jurídicas básicas e agende consultas',
            cafeteria: 'Crie um agente para minha cafeteria que apresente o menu, faça pedidos e aceite Pix/cartão',
            academia: 'Crie um agente para minha academia que informe planos (mensal R$99, semestral R$89/mês) e agende aulas experimentais',
            design: 'Crie um agente para meu estúdio de design que apresente portfólio, faça orçamentos e agende reuniões',
        };
        setPrompt(templates[categoryId] || '');
        textareaRef.current?.focus();
    };

    const handleSubmit = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setStep('processing');
        setLoadingMessage("Analisando sua descrição...");

        try {
            console.log('📝 Enviando para extração:', prompt);

            const extractRes = await fetch(`${API_CONFIG.BASE_URL}/api/agent/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!extractRes.ok) throw new Error('Falha na extração');

            const extractData = await extractRes.json();
            console.log('✅ Informações extraídas:', extractData);

            setExtractedInfo(extractData.data);
            setLoadingMessage("Configurando ferramentas...");

            await new Promise(r => setTimeout(r, 1500));
            setLoadingMessage("Gerando seu agente de vendas...");

            const generateRes = await fetch(`${API_CONFIG.BASE_URL}/api/agent/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extractedInfo: extractData.data,
                    originalPrompt: prompt
                }),
            });

            if (!generateRes.ok) throw new Error('Falha na geração');

            const generateData = await generateRes.json();
            console.log('✅ Prompt gerado:', generateData.prompt);

            setGeneratedPrompt(generateData.prompt);
            setStep('done');

            if (onAgentCreated) {
                onAgentCreated(generateData.prompt, extractData.data);
            }

        } catch (error) {
            console.error('❌ Erro:', error);
            setLoadingMessage("Erro ao processar. Tente novamente.");
            await new Promise(r => setTimeout(r, 2000));
            setStep('input');
        } finally {
            setIsLoading(false);
        }
    };

    // Processing step UI - LIGHT MODE
    if (step === 'processing') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                {/* Menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSidebar}
                    className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div className="w-full max-w-2xl mx-auto p-8">
                    {/* Steps indicator */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                1
                            </div>
                            <span className="text-gray-900 font-medium">Criando agente</span>
                        </div>
                        <div className="w-12 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm">
                                2
                            </div>
                            <span className="text-gray-400">Conectar integrações</span>
                        </div>
                        <div className="w-12 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm">
                                3
                            </div>
                            <span className="text-gray-400">Conectar</span>
                        </div>
                    </div>

                    {/* Loading card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                        <h2 className="text-2xl font-semibold text-emerald-600 text-center mb-6">
                            {loadingMessage}
                        </h2>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-pulse"
                                style={{ width: '60%' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Done step UI - LIGHT MODE
    if (step === 'done' && extractedInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                {/* Menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSidebar}
                    className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div className="w-full max-w-2xl mx-auto p-8">
                    {/* Steps indicator */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-emerald-600 font-medium">Criando agente</span>
                        </div>
                        <div className="w-12 h-px bg-emerald-500" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                2
                            </div>
                            <span className="text-gray-900 font-medium">Conectar integrações</span>
                        </div>
                        <div className="w-12 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 font-bold text-sm">
                                3
                            </div>
                            <span className="text-gray-400">Conectar</span>
                        </div>
                    </div>

                    {/* Success card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Agente criado com sucesso!
                            </h2>
                            <p className="text-gray-500">
                                Seu agente para <span className="text-emerald-600 font-medium">{extractedInfo.business_type}</span> está pronto
                            </p>
                        </div>

                        {/* Detected info */}
                        <div className="space-y-4 mb-6">
                            {extractedInfo.products.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Produtos detectados:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedInfo.products.map((p, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm border border-orange-200">
                                                {p.name} {p.price && `- ${p.price}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {extractedInfo.payment_methods.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Pagamentos:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedInfo.payment_methods.map((m, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm border border-purple-200">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {extractedInfo.integrations.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Integrações:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractedInfo.integrations.map((i, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm border border-blue-200">
                                                {i}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6"
                            onClick={() => console.log('Próximo passo: integrações')}
                        >
                            Continuar para Integrações
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Main input UI - LIGHT MODE
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
            {/* Menu button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
            >
                <Menu className="w-5 h-5" />
            </Button>

            <div className="w-full max-w-4xl mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Factoria</span>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <span className="text-gray-900">Seu </span>
                        <span className="text-emerald-600">Vendedor Virtual</span>
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Descreva seu negócio e deixe a IA criar seu agente comercial
                    </p>
                </div>

                {/* Input Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg mb-6">
                    <div className="flex gap-3">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Como você gostaria de construir seu agente?"
                            className={cn(
                                "flex-1 bg-transparent border-none resize-none text-gray-900 text-lg",
                                "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                "min-h-[60px] max-h-[200px]"
                            )}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || isLoading}
                            className={cn(
                                "rounded-full w-12 h-12 p-0 self-end",
                                prompt.trim()
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    : "bg-gray-200 text-gray-400"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowRight className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Category buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                    {BUSINESS_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full",
                                "bg-white border border-gray-200 hover:border-gray-300 shadow-sm",
                                "text-gray-700 hover:text-gray-900 transition-all",
                                "hover:scale-105 active:scale-95"
                            )}
                        >
                            <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                            <span className="text-sm">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

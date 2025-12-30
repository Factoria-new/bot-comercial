
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'tags' | 'time' | 'file' | 'checkbox-group' | 'radio-group' | 'repeater';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    options?: string[]; // For select, radio, checkbox-group
    required?: boolean;
    helperText?: string;
    // For repeater fields
    subFields?: FormField[]; // Fields for each item in the repeater
    addButtonText?: string; // Text for the "Add Item" button
}

export interface FormStep {
    id: string;
    title: string;
    description: string;
    fields: FormField[];
}

export interface NicheSchema {
    id: string;
    title: string;
    description: string; // Overall description
    steps: FormStep[];
}

// Reusable fields across niches to ensure consistency
const IDENTITY_FIELDS: FormField[] = [
    { name: 'businessName', label: 'Nome da Empresa', type: 'text', placeholder: 'Ex: Pizzaria do João', required: true },
    { name: 'assistantName', label: 'Nome do Assistente', type: 'text', placeholder: 'Ex: Lia, atendente virtual', required: true },
    { name: 'description', label: 'Descrição do Negócio', type: 'textarea', placeholder: 'Breve descrição do que sua empresa faz...', helperText: 'Ajuda a IA a entender o contexto.' }
];

// Unified Operations Fields - Now focused on Redirection Link
const OPERATIONS_FIELDS: FormField[] = [
    {
        name: 'openingHours',
        label: 'Horário de Atendimento',
        type: 'text',
        placeholder: 'Ex: Seg a Sex das 9h às 18h',
        required: true
    },
    {
        name: 'ctaLink',
        label: 'Link de Destino / Agendamento',
        type: 'text',
        placeholder: 'Ex: https://wa.me/..., https://agendar.com/...',
        required: true,
        helperText: 'Para onde o cliente será enviado ao finalizar o atendimento.'
    }
];

export const NICHE_SCHEMAS: Record<string, NicheSchema> = {
    restaurant: {
        id: 'restaurant',
        title: 'Restaurante & Delivery',
        description: 'Ideal para pizzarias, lanchonetes e restaurantes.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade',
                description: 'Informações essenciais do seu negócio.',
                fields: [...IDENTITY_FIELDS]
            },
            {
                id: 'operations',
                title: 'Operação',
                description: 'Horários e Link de Pedido.',
                fields: [
                    ...OPERATIONS_FIELDS,
                    {
                        name: 'deliveryArea',
                        label: 'Área de Entrega (Resumo)',
                        type: 'text',
                        placeholder: 'Ex: Centro e Zona Sul'
                    }
                ]
            },
            {
                id: 'catalog',
                title: 'Cardápio Principal',
                description: 'Seus principais pratos e produtos.',
                fields: [
                    {
                        name: 'menuItems',
                        label: 'Itens do Cardápio',
                        type: 'repeater',
                        addButtonText: 'Adicionar Item',
                        subFields: [
                            { name: 'name', label: 'Nome do Prato', type: 'text', placeholder: 'Ex: Pizza Calabresa' },
                            { name: 'price', label: 'Preço (R$)', type: 'text', placeholder: 'Ex: 45,00' },
                            { name: 'description', label: 'Ingredientes', type: 'textarea', placeholder: 'Molho, queijo...' }
                        ]
                    }
                ]
            }
        ]
    },
    beauty: {
        id: 'beauty',
        title: 'Estética & Beleza',
        description: 'Salões, barbearias e clínicas de estética.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade',
                description: 'Informações do seu espaço de beleza.',
                fields: [...IDENTITY_FIELDS]
            },
            {
                id: 'operations',
                title: 'Agendamento',
                description: 'Horários e Link de Agenda.',
                fields: [...OPERATIONS_FIELDS]
            },
            {
                id: 'catalog',
                title: 'Serviços',
                description: 'Quais procedimentos você realiza.',
                fields: [
                    {
                        name: 'servicesList',
                        label: 'Lista de Serviços',
                        type: 'repeater',
                        addButtonText: 'Adicionar Serviço',
                        subFields: [
                            { name: 'name', label: 'Nome do Serviço', type: 'text', placeholder: 'Ex: Corte Masculino' },
                            { name: 'price', label: 'Preço Estimado', type: 'text', placeholder: 'Ex: R$ 50,00' },
                            { name: 'duration', label: 'Duração (min)', type: 'text', placeholder: 'Ex: 40 min' }
                        ]
                    }
                ]
            }
        ]
    },
    services: {
        id: 'services',
        title: 'Prestação de Serviços',
        description: 'Técnicos, manutenção, consultoria e autônomos.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade',
                description: 'Informações do profissional ou empresa.',
                fields: [...IDENTITY_FIELDS]
            },
            {
                id: 'operations',
                title: 'Atendimento',
                description: 'Horários e Contato.',
                fields: [...OPERATIONS_FIELDS]
            },
            {
                id: 'catalog',
                title: 'Tipos de Serviço',
                description: 'O que você oferece.',
                fields: [
                    {
                        name: 'serviceTypes',
                        label: 'Especialidades',
                        type: 'repeater',
                        addButtonText: 'Adicionar Especialidade',
                        subFields: [
                            { name: 'type', label: 'Tipo de Serviço', type: 'text', placeholder: 'Ex: Manutenção de Ar Condicionado' },
                            { name: 'details', label: 'Detalhes/Condições', type: 'textarea', placeholder: 'Visita técnica R$ 100...' }
                        ]
                    }
                ]
            }
        ]
    },
    real_estate: {
        id: 'real_estate',
        title: 'Imobiliária & Corretores',
        description: 'Venda e aluguel de imóveis.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade',
                description: 'Dados da imobiliária ou corretor.',
                fields: [
                    ...IDENTITY_FIELDS,
                    { name: 'creci', label: 'CRECI (Opcional)', type: 'text', placeholder: '...' }
                ]
            },
            {
                id: 'operations',
                title: 'Processo',
                description: 'Horários e Link de Contato.',
                fields: [...OPERATIONS_FIELDS]
            },
            {
                id: 'catalog',
                title: 'Tipos de Imóveis',
                description: 'O foco da sua carteira.',
                fields: [
                    {
                        name: 'propertyTypes',
                        label: 'Foco de Atuação',
                        type: 'checkbox-group',
                        options: ['Venda', 'Aluguel', 'Lançamentos', 'Comercial', 'Residencial', 'Terrenos']
                    }
                ]
            }
        ]
    },
    general: {
        id: 'general',
        title: 'Configuração Geral',
        description: 'Configure seu assistente para qualquer tipo de negócio.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade',
                description: 'Informações do seu negócio.',
                fields: [...IDENTITY_FIELDS]
            },
            {
                id: 'operations',
                title: 'Operação',
                description: 'Horários e Links.',
                fields: [...OPERATIONS_FIELDS]
            },
            {
                id: 'details',
                title: 'Detalhes',
                description: 'Produtos, serviços ou informações importantes.',
                fields: [
                    {
                        name: 'products',
                        label: 'Produtos & Serviços',
                        type: 'repeater',
                        addButtonText: 'Adicionar Item',
                        subFields: [
                            { name: 'name', label: 'Nome do Item', type: 'text', placeholder: 'Ex: Pizza Calabresa / Consultoria' },
                            { name: 'description', label: 'Detalhes ou Preço', type: 'text', placeholder: 'Ex: R$ 45,00 - Molho especial' }
                        ]
                    }
                ]
            }
        ]
    }
};

export function getSchemaForNiche(nicheTag: string): NicheSchema {
    const key = nicheTag.toLowerCase().trim();
    if (key.includes('restaurant') || key.includes('food') || key.includes('pizzaria')) return NICHE_SCHEMAS.restaurant;
    if (key.includes('beauty') || key.includes('salao') || key.includes('estetica')) return NICHE_SCHEMAS.beauty;
    if (key.includes('real') || key.includes('imob') || key.includes('casa')) return NICHE_SCHEMAS.real_estate;
    // Default to services if ambiguous or explicit
    // Default to general schema
    return NICHE_SCHEMAS.general;
}

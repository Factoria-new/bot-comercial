
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

export const NICHE_SCHEMAS: Record<string, NicheSchema> = {
    restaurant: {
        id: 'restaurant',
        title: 'Configuração de Restaurante/Delivery',
        description: 'Vamos configurar o atendimento para sua pizzaria ou restaurante.',
        steps: [
            {
                id: 'identity',
                title: 'Identidade do Negócio',
                description: 'Informações básicas para o cliente te encontrar.',
                fields: [
                    { name: 'businessName', label: 'Nome do Estabelecimento', type: 'text', placeholder: 'Ex: Pizzaria Do Chef', required: true },
                    { name: 'description', label: 'Descrição Curta', type: 'textarea', placeholder: 'Ex: A melhor pizza de forno a lenha da cidade...', helperText: 'Essa descrição ajuda a IA a entender o tom da marca.' }
                ]
            },
            {
                id: 'menu',
                title: 'Cardápio e Produtos',
                description: 'Cadastre os principais itens ou categorias do seu cardápio.',
                fields: [
                    {
                        name: 'menuItems',
                        label: 'Itens do Cardápio',
                        type: 'repeater',
                        addButtonText: 'Adicionar Item/Categoria',
                        subFields: [
                            { name: 'name', label: 'Nome do Item/Categoria', type: 'text', placeholder: 'Ex: Pizza Calabresa ou Bebidas' },
                            { name: 'price', label: 'Preço / Faixa de Preço', type: 'text', placeholder: 'Ex: R$ 45,00 a R$ 60,00' },
                            { name: 'details', label: 'Ingredientes / Detalhes', type: 'textarea', placeholder: 'Ex: Molho, mussarela, calabresa e cebola.' }
                        ]
                    },
                    {
                        name: 'menuDigitalUrl',
                        label: 'Link do Cardápio Digital (Opcional)',
                        type: 'text',
                        placeholder: 'https://...',
                        helperText: 'Se tiver um PDF ou site, cole o link aqui.'
                    }
                ]
            },
            {
                id: 'operations',
                title: 'Operação e Pagamento',
                description: 'Como funciona o atendimento e entrega.',
                fields: [
                    {
                        name: 'openingHours',
                        label: 'Horário de Funcionamento',
                        type: 'textarea', // Textarea for flexibility for now
                        placeholder: 'Ex: Terça a Domingo das 18h às 23h',
                        required: true
                    },
                    {
                        name: 'paymentMethods',
                        label: 'Formas de Pagamento Aceitas',
                        type: 'checkbox-group',
                        options: ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Vale Refeição']
                    },
                    {
                        name: 'deliveryType',
                        label: 'Tipo de Entrega',
                        type: 'radio-group',
                        options: ['Entrega Própria', 'iFood/Apps', 'Retirada no Balcão', 'Híbrido (Própria + Apps)']
                    }
                ]
            }
        ]
    },
    health: {
        id: 'health',
        title: 'Configuração de Clínica/Saúde',
        description: 'Informações para agendamento e dúvidas de pacientes.',
        steps: [
            {
                id: 'identity',
                title: 'Dados da Clínica',
                description: 'Quem é o profissional ou a clínica?',
                fields: [
                    { name: 'businessName', label: 'Nome da Clínica ou Dr(a).', type: 'text', placeholder: 'Ex: Dr. Silva Odontologia', required: true },
                    { name: 'specialty', label: 'Especialidade Principal', type: 'text', placeholder: 'Ex: Ortodontia e Implantes' }
                ]
            },
            {
                id: 'services',
                title: 'Serviços e Convênios',
                description: 'O que você oferece aos pacientes.',
                fields: [
                    {
                        name: 'servicesList',
                        label: 'Lista de Procedimentos/Serviços',
                        type: 'repeater',
                        addButtonText: 'Adicionar Serviço',
                        subFields: [
                            { name: 'serviceName', label: 'Nome do Procedimento', type: 'text', placeholder: 'Ex: Limpeza Dental' },
                            { name: 'duration', label: 'Duração Média', type: 'text', placeholder: 'Ex: 30 min' },
                            { name: 'price', label: 'Valor (Particular)', type: 'text', placeholder: 'Ex: R$ 150,00 ou "Sob consulta"' }
                        ]
                    },
                    {
                        name: 'insurances',
                        label: 'Convênios Aceitos',
                        type: 'tags',
                        placeholder: 'Digite e aperte Enter (ex: Unimed, Bradesco)',
                        helperText: 'Deixe em branco se for apenas particular.'
                    }
                ]
            },
            {
                id: 'scheduling',
                title: 'Agendamento e Local',
                description: 'Como o paciente te encontra.',
                fields: [
                    { name: 'address', label: 'Endereço Completo', type: 'text', placeholder: 'Rua, Número, Bairro...' },
                    { name: 'schedulingLink', label: 'Link de Agendamento (Doctoralia/Outro)', type: 'text', placeholder: 'https://...' }
                ]
            }
        ]
    },
    beauty: {
        id: 'beauty',
        title: 'Estética e Beleza',
        description: 'Configure seus serviços de beleza.',
        steps: [
            {
                id: 'info',
                title: 'Informações Básicas',
                description: 'Fale sobre seu salão ou estúdio.',
                fields: [
                    { name: 'businessName', label: 'Nome do Espaço', type: 'text', required: true },
                    { name: 'services', label: 'Serviços Principais', type: 'tags', placeholder: 'Corte, Mechas, Manicure...' }
                ]
            },
            {
                id: 'details',
                title: 'Detalhes',
                description: 'Preços e Agendamento',
                fields: [
                    {
                        name: 'servicesList',
                        label: 'Serviços Detalhados',
                        type: 'repeater',
                        addButtonText: 'Adicionar Serviço',
                        subFields: [
                            { name: 'name', label: 'Serviço', type: 'text' },
                            { name: 'price', label: 'Preço', type: 'text' }
                        ]
                    }
                ]
            }

        ]
    },
    store: {
        id: 'store',
        title: 'Loja e Varejo',
        description: 'Venda de produtos físicos.',
        steps: [
            {
                id: 'info',
                title: 'Sua Loja',
                description: 'O que você vende?',
                fields: [
                    { name: 'businessName', label: 'Nome da Loja', type: 'text', required: true },
                    { name: 'niche', label: 'Nicho (Roupas, Eletrônicos...)', type: 'text' }
                ]
            },
            {
                id: 'catalog',
                title: 'Destaques do Catálogo',
                description: 'Produtos principais.',
                fields: [
                    {
                        name: 'topProducts',
                        label: 'Produtos em Destaque',
                        type: 'repeater',
                        addButtonText: 'Adicionar Produto',
                        subFields: [
                            { name: 'name', label: 'Produto', type: 'text' },
                            { name: 'price', label: 'Preço', type: 'text' }
                        ]
                    }
                ]
            }
        ]
    },
    generic: {
        id: 'generic',
        title: 'Informações do Negócio',
        description: 'Configure seu assistente.',
        steps: [
            {
                id: 'general',
                title: 'Dados Gerais',
                description: 'Fale um pouco sobre o que você faz.',
                fields: [
                    { name: 'businessName', label: 'Nome do Negócio', type: 'text', required: true },
                    { name: 'description', label: 'O que sua empresa faz?', type: 'textarea' },
                    { name: 'contact', label: 'Contato (Tel/Email)', type: 'text' }
                ]
            }
        ]
    }
};

export function getSchemaForNiche(nicheTag: string): NicheSchema {
    const key = nicheTag.toLowerCase().trim();
    if (key.includes('restaurant') || key.includes('pizzaria') || key.includes('food') || key.includes('lanchonete')) return NICHE_SCHEMAS.restaurant;
    if (key.includes('health') || key.includes('medic') || key.includes('clinic') || key.includes('doctor') || key.includes('dentista')) return NICHE_SCHEMAS.health;
    if (key.includes('beauty') || key.includes('salon') || key.includes('estetica')) return NICHE_SCHEMAS.beauty;
    if (key.includes('store') || key.includes('shop') || key.includes('retail')) return NICHE_SCHEMAS.store;
    return NICHE_SCHEMAS.generic;
}

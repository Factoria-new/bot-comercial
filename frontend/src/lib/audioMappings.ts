/**
 * @file audioMappings.ts
 * @description Maps UI triggers to Audio Files (3 variations for randomization).
 * Assuming audio files are located in /public/audio/lia/
 */

export type AudioTriggerType =
    | 'intro_modal'
    | 'step_identity'
    | 'step_catalog'
    | 'focus_description'
    | 'focus_assistant_name'
    | 'complete'
    | 'integrations'
    | 'upload_success'
    | 'integrations_success';

interface AudioVariation {
    id: string;
    path: string;
    text: string; // Transcript for accessibility/fallback
}

// Helper to generate variations
const defineVariations = (baseName: string, count: number, texts: string[]): AudioVariation[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `${baseName}_${i + 1}`,
        path: `/audio/lia/${baseName}_v${i + 1}.mp3`,
        text: texts[i] || texts[0]
    }));
};

export const AUDIO_MAPPINGS: Record<AudioTriggerType, AudioVariation[]> = {
    'intro_modal': defineVariations('intro_wizard', 3, [
        "Olá! Sou a Lia. Vamos configurar seu agente juntos.",
        "Oi! Que bom te ver. Vamos criar um assistente incrível para você.",
        "Bem-vindo! Eu sou a Lia. Vou te guiar nesse processo rápido."
    ]),
    'step_identity': defineVariations('step_identity', 3, [
        "Primeiro, me conte um pouco sobre sua empresa e quem será o assistente.",
        "Vamos começar pelo básico: Qual o nome do seu negócio?",
        "Para começar, preciso saber o nome da empresa e como vamos chamar seu agente."
    ]),
    'step_catalog': defineVariations('step_catalog', 3, [
        "Quase lá! Agora vamos adicionar seus produtos ou serviços principais.",
        "Agora a parte importante: O que você vende? Vamos cadastrar alguns itens.",
        "Perfeito. Agora preciso saber o que você oferece aos clientes."
    ]),
    'focus_description': defineVariations('help_description', 3, [
        "Aqui você pode falar resumidamente o que sua empresa faz. Isso ajuda a IA a entender o contexto.",
        "Nesse campo, descreva seu negócio em poucas palavras. Exemplo: 'Pizzaria tradicional com forno a lenha'.",
        "Uma dica: Seja breve mas específico. Fale o que você tem de melhor!"
    ]),
    'focus_assistant_name': defineVariations('help_assistant_name', 3, [
        "Dê um nome para seu agente. Pode ser algo humanizado como 'Bia' ou 'João'.",
        "Escolha um nome amigável para seu assistente virtual.",
        "Como você quer que o assistente se apresente? Escolha um nome legal."
    ]),
    'complete': defineVariations('wizard_complete', 3, [
        "Tudo pronto! Seu agente foi criado. Vamos testar?",
        "Parabéns! Finalizamos. Você já pode conversar com seu novo agente.",
        "Excelente! Configurei tudo. Clique em testar para ver como ficou."
    ]),
    'integrations': defineVariations('integrations', 3, [
        "Parabéns! Seu agente está pronto! Agora é hora de conectar ele às suas plataformas de atendimento. As integrações permitem que seu agente responda automaticamente seus clientes no WhatsApp, Instagram, Facebook e outras redes. Escolha uma plataforma abaixo para começar.",
        "Excelente! Seu assistente está configurado. Vamos ativá-lo nas suas redes sociais? Escolha abaixo onde você quer que ele atenda seus clientes.",
        "Tudo certo! Agora só falta conectar seu agente. Selecione uma plataforma para ativar o atendimento automático."
    ]),
    'upload_success': defineVariations('upload_success', 3, [
        "Recebi o prompt do seu agente e está tudo pronto. Se quiser ver como ele responde, é só clicar no botão 'Testar Agente'.",
        "Prompt recebido e processado com sucesso! Agora você pode verificar as respostas dele clicando em 'Testar Agente'.",
        "Tudo certo com o prompt do seu agente! O ambiente de teste está liberado. Clique no botão 'Testar Agente' para começar."
    ]),
    'integrations_success': defineVariations('integrations_success', 3, [
        "Parabéns! Seu agente está pronto! Agora é hora de conectar ele às suas plataformas de atendimento. Escolha uma plataforma abaixo para começar.",
        "Excelente! Seu assistente está configurado. Vamos ativá-lo nas suas redes sociais? Escolha abaixo onde você quer que ele atenda seus clientes.",
        "Tudo certo! Agora só falta conectar seu agente. Selecione uma plataforma para ativar o atendimento automático."
    ])
};

export const getRandomAudio = (trigger: AudioTriggerType): AudioVariation => {
    const variations = AUDIO_MAPPINGS[trigger];
    if (!variations || variations.length === 0) return { id: 'default', path: '', text: '' };

    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
};

/**
 * @file audioMappings.ts
 * @description Maps UI triggers to Audio Files (3 variations for randomization).
 * Assuming audio files are located in /public/audio/lia/
 */

export type AudioTriggerType =
    | 'intro_modal'
    | 'step_identity'
    | 'step_location' // NEW
    | 'step_strategy' // NEW
    | 'step_catalog'
    | 'focus_description'
    | 'focus_description'
    | 'focus_assistant_name'
    | 'focus_links' // NEW
    | 'complete'
    | 'integrations'
    | 'upload_success'
    | 'integrations_success'
    | 'step_operations' // NEW
    | 'dashboard_suggestion' // NEW
    | 'step_details'; // NEW

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
        "Olá! Sou a Lia. Vamos configurar seu assistente juntos.",
        "Oi! Que bom te ver. Vamos criar um assistente incrível para você.",
        "Bem-vindo! Eu sou a Lia. Vou te guiar nesse processo rápido."
    ]),
    'step_identity': defineVariations('step_identity', 3, [
        "Primeiro, me conte um pouco sobre sua empresa e quem será o assistente.",
        "Vamos começar pelo básico: Qual o nome do seu negócio?",
        "Para começar, preciso saber o nome da empresa e como vamos chamar seu assistente."
    ]),
    'step_location': defineVariations('step_location', 3, [
        "Agora, me diga onde você trabalha. Se for atendimento apenas online, é só marcar a opção.",
        "Precisamos saber sua localização. Caso sua empresa seja 100% digital, selecione 'Atendimento Online'.",
        "Onde fica o seu negócio? Se você não tiver endereço físico, marque a opção de atendimento online."
    ]),
    'step_strategy': defineVariations('step_strategy', 3, [
        "Como você quer que o assistente atue? Ele pode tentar vender ativamente ou apenas tirar dúvidas e redirecionar.",
        "Agora escolha a personalidade: Vendedor focado em conversão ou um Facilitador que apenas tira dúvidas?",
        "Qual será o objetivo principal? Você pode escolher entre um vendedor agressivo ou um assistente que redireciona."
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
        "Dê um nome para seu assistente. Pode ser algo humanizado como 'Bia' ou 'João'.",
        "Escolha um nome amigável para seu assistente virtual.",
        "Como você quer que o assistente se apresente? Escolha um nome legal."
    ]),
    'focus_links': defineVariations('help_links', 3, [
        "Aqui você pode adicionar quantos links quiser. Não esqueça de colocar uma breve descrição para o Assistente saber quando usar cada um.",
        "Adicione seus links importantes aqui, como site, redes sociais ou agendamento. A descrição ajuda o Assistente a escolher o link certo.",
        "Use esse espaço para listar links úteis. Diga para o que serve cada um, assim o Assistente envia a informação correta para o cliente."
    ]),
    'complete': defineVariations('wizard_complete', 3, [
        "Tudo pronto! Seu assistente foi criado. Vamos testar?",
        "Parabéns! Finalizamos. Você já pode conversar com seu novo assistente.",
        "Excelente! Configurei tudo. Clique em testar para ver como ficou."
    ]),
    'integrations': defineVariations('integrations', 3, [
        "Parabéns! Seu assistente está pronto! Agora é hora de conectar ele às suas plataformas de atendimento. As integrações permitem que seu assistente responda automaticamente seus clientes no WhatsApp, Instagram, Facebook e outras redes. Escolha uma plataforma abaixo para começar.",
        "Excelente! Seu assistente está configurado. Vamos ativá-lo nas suas redes sociais? Escolha abaixo onde você quer que ele atenda seus clientes.",
        "Tudo certo! Agora só falta conectar seu assistente. Selecione uma plataforma para ativar o atendimento automático."
    ]),
    'upload_success': defineVariations('upload_success', 3, [
        "Recebi o prompt do seu assistente e está tudo pronto. Se quiser ver como ele responde, é só clicar no botão 'Testar Assistente'.",
        "Prompt recebido e processado com sucesso! Agora você pode verificar as respostas dele clicando em 'Testar Assistente'.",
        "Tudo certo com o prompt do seu assistente! O ambiente de teste está liberado. Clique no botão 'Testar Assistente' para começar."
    ]),
    'integrations_success': defineVariations('integrations_success', 3, [
        "Integração realizada com sucesso! Seu assistente já está conectado e pronto para atender.",
        "Prontinho! A conexão foi feita e seu assistente já está ativo na plataforma.",
        "Tudo certo! Integração finalizada. Seu assistente já começou a trabalhar."
    ]),
    'step_operations': defineVariations('step_operations', 3, [
        "Agora, defina seu horário de atendimento e o link para onde o cliente será enviado, como seu WhatsApp ou agendamento.",
        "Estamos quase lá! Configure os horários que você trabalha e o link principal para finalizar o atendimento.",
        "Para finalizar a parte operacional, preciso saber seus horários e para onde devo levar o cliente quando ele quiser comprar ou agendar."
    ]),
    'dashboard_suggestion': defineVariations('dashboard_suggestion', 3, [
        "Seu painel está ativo! Dica rápida: que tal conectar também o Instagram ou Facebook para centralizar todo o seu atendimento aqui?",
        "Tudo pronto por aqui. Se quiser ampliar o alcance do seu assistente, sugiro conectar outras redes sociais clicando em 'Gerenciar Integrações'.",
        "Bem-vindo ao seu Dashboard. Aproveite para explorar outras integrações e deixar seu assistente ainda mais completo em todos os canais."
    ]),
    'step_details': defineVariations('step_details', 3, [
        "Agora, me diga quais são seus principais produtos ou serviços. Preciso saber o nome e o preço ou uma breve descrição.",
        "Vamos cadastrar o que você vende. Adicione os itens principais para que eu possa oferecê-los aos seus clientes.",
        "Chegou a hora de adicionar seu catálogo. Liste seus produtos ou serviços com detalhes e valores."
    ])
};

export const getRandomAudio = (trigger: AudioTriggerType): AudioVariation => {
    const variations = AUDIO_MAPPINGS[trigger];
    if (!variations || variations.length === 0) return { id: 'default', path: '', text: '' };

    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
};

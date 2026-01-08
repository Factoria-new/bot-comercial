
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAudio } from '../src/services/ttsService.js';

// Load paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const OUTPUT_DIR = path.resolve(rootDir, 'frontend/public/audio/lia');

const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY or API_GEMINI not found in environment');
    process.exit(1);
}

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const AUDIO_DATA = [
    // INTRO
    { id: 'intro_wizard_v1', text: "Olá! Sou a Lia. Vamos configurar seu assistente juntos." },
    { id: 'intro_wizard_v2', text: "Oi! Que bom te ver. Vamos criar um assistente incrível para você." },
    { id: 'intro_wizard_v3', text: "Bem-vindo! Eu sou a Lia. Vou te guiar nesse processo rápido." },

    // STEP IDENTITY
    { id: 'step_identity_v1', text: "Primeiro, me conte um pouco sobre sua empresa e quem será o assistente." },
    { id: 'step_identity_v2', text: "Vamos começar pelo básico: Qual o nome do seu negócio?" },
    { id: 'step_identity_v3', text: "Para começar, preciso saber o nome da empresa e como vamos chamar seu assistente." },

    // STEP OPERATIONS
    { id: 'step_operations_v1', text: "Agora, defina seu horário de atendimento e o link para onde o cliente será enviado, como seu contato ou agendamento." },
    { id: 'step_operations_v2', text: "Estamos quase lá! Configure os horários que você trabalha e o link principal para finalizar o atendimento." },
    { id: 'step_operations_v3', text: "Para finalizar a parte operacional, preciso saber seus horários e para onde devo levar o cliente quando ele quiser comprar ou agendar." },

    // STEP CATALOG
    { id: 'step_catalog_v1', text: "Quase lá! Agora vamos adicionar seus produtos ou serviços principais." },
    { id: 'step_catalog_v2', text: "Agora a parte importante: O que você vende? Vamos cadastrar alguns itens." },
    { id: 'step_catalog_v3', text: "Perfeito. Agora preciso saber o que você oferece aos clientes." },

    // FOCUS DESCRIPTION
    { id: 'help_description_v1', text: "Aqui você pode falar resumidamente o que sua empresa faz. Isso ajuda a IA a entender o contexto." },
    { id: 'help_description_v2', text: "Nesse campo, descreva seu negócio em poucas palavras. Exemplo: 'Pizzaria tradicional com forno a lenha'." },
    { id: 'help_description_v3', text: "Uma dica: Seja breve mas específico. Fale o que você tem de melhor!" },

    // FOCUS ASSISTANT NAME
    { id: 'help_assistant_name_v1', text: "Dê um nome para seu assistente. Pode ser algo humanizado como 'Bia' ou 'João'." },
    { id: 'help_assistant_name_v2', text: "Escolha um nome amigável para seu assistente virtual." },
    { id: 'help_assistant_name_v3', text: "Como você quer que o assistente se apresente? Escolha um nome legal." },

    // COMPLETE
    { id: 'wizard_complete_v1', text: "Pronto! Seu agente foi criado. Aqui nesta tela você pode testá-lo e, se precisar de ajustes, é só me pedir no chat ao lado." },
    { id: 'wizard_complete_v2', text: "Terminamos! Agora você está no ambiente de teste. Converse com seu agente para ver como ele responde, e me chame se quiser mudar alguma coisa." },
    { id: 'wizard_complete_v3', text: "Agente configurado com sucesso. Sinta-se à vontade para testar as respostas dele aqui. Se algo não estiver como você quer, eu posso ajustar para você rapidinho." }
];

async function generateAudioItem(item) {
    const filePath = path.join(OUTPUT_DIR, `${item.id}.mp3`);

    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping existing: ${item.id}.mp3`);
        return;
    }

    console.log(`🎙️  Generating: ${item.id} -> "${item.text}"`);

    try {
        const result = await generateAudio(item.text, 'Kore', API_KEY);
        fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
        console.log(`✅ Saved: ${item.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${item.id}:`, error.message);
    }
}

async function run() {
    console.log(`🚀 Starting Wizard Audio Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    for (const item of AUDIO_DATA) {
        await generateAudioItem(item);
        // Delay to avoid rate limits (approx 12 RPM)
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`✨ All Done!`);
}

run();

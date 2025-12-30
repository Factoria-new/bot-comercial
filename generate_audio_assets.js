
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAudio } from './backend/src/services/ttsService.js';

// Load paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '.');

// Env is expected to be loaded via node --env-file=.env
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY or API_GEMINI not found in environment');
    process.exit(1);
}

const OUTPUT_DIR = path.resolve(rootDir, 'frontend/public/audio/lia');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define mappings manually to avoid TS compilation issues in this script
// Using the exact text from frontend/src/lib/audioMappings.ts
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
    { id: 'step_operations_v1', text: "Agora, como você quer que ele trabalhe? Venda direta ou apenas atendimento?" },
    { id: 'step_operations_v2', text: "Certo! Vamos configurar como o assistente vai vender e seus horários." },
    { id: 'step_operations_v3', text: "Entendi. Agora me diga: qual o seu modelo de venda e horário de funcionamento?" },

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
    { id: 'wizard_complete_v1', text: "Tudo pronto! Seu assistente foi criado. Vamos testar?" },
    { id: 'wizard_complete_v2', text: "Parabéns! Finalizamos. Você já pode conversar com seu novo assistente." },
    { id: 'wizard_complete_v3', text: "Excelente! Configurei tudo. Clique em testar para ver como ficou." }
];

async function generateAudioItem(item) {
    const filePath = path.join(OUTPUT_DIR, `${item.id}.mp3`);

    // Check if exists - we SKIP if exists, but user asked to regenerate. 
    // I will act conservatively and NOT delete blindly here, because verify step will delete.
    // However, the user said "Refaça", implying regeneration.
    // I will remove the check for existing file OR I will rely on my verification step to delete them first.
    // Let's KEEP the check but I will delete files before running this script in the next steps.
    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping existing: ${item.id}.mp3`);
        return;
    }

    console.log(`🎙️  Generating: ${item.id} -> "${item.text}"`);

    try {
        // Use ttsService with Kore voice
        const result = await generateAudio(item.text, 'Kore', API_KEY);

        fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
        console.log(`✅ Saved: ${item.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${item.id}:`, error.message);
    }
}

async function run() {
    console.log(`🚀 Starting Audio Asset Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    for (const item of AUDIO_DATA) {
        await generateAudioItem(item);
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`✨ All Done!`);
}

run();

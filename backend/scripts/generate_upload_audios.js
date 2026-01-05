
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAudio } from '../src/services/ttsService.js';

// Load paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../'); // Go up to root

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

const variations = [
    // Upload Success
    { id: 'upload_success_v1', text: "Recebi o arquivo! Vou analisar e criar seu assistente agora mesmo." },
    { id: 'upload_success_v2', text: "Arquivo recebido com sucesso. Aguarde um instante enquanto configuro seu assistente." },
    { id: 'upload_success_v3', text: "Tudo certo com o upload. Já estou processando as informações do seu assistente." },

    // Integrations
    { id: 'integrations_success_v1', text: "Integração realizada! Seu assistente já está conectado e pronto." },
    { id: 'integrations_success_v2', text: "Conectado com sucesso! Agora seu assistente tem superpoderes." },
    { id: 'integrations_success_v3', text: "Pronto! Integração concluída. Vamos ver o assistente em ação?" },

    // Dashboard Suggestion
    { id: 'dashboard_suggestion_v1', text: "Seu painel está ativo! Dica rápida: que tal conectar também o Instagram ou Facebook para centralizar todo o seu atendimento aqui?" },
    { id: 'dashboard_suggestion_v2', text: "Tudo pronto por aqui. Se quiser ampliar o alcance do seu assistente, sugiro conectar outras redes sociais clicando em 'Gerenciar Integrações'." },
    { id: 'dashboard_suggestion_v3', text: "Bem-vindo ao seu Dashboard. Aproveite para explorar outras integrações e deixar seu assistente ainda mais completo em todos os canais." }
];

async function generateAudioItem(item) {
    const filePath = path.join(OUTPUT_DIR, `${item.id}.mp3`);

    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping existing: ${item.id}.mp3`);
        return;
    }

    console.log(`�️  Generating: ${item.id} -> "${item.text}"`);

    try {
        const result = await generateAudio(item.text, 'Kore', API_KEY);
        fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
        console.log(`✅ Saved: ${item.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${item.id}:`, error.message);
    }
}

async function run() {
    console.log(`🚀 Starting Upload/Integration Audio Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    for (const item of variations) {
        await generateAudioItem(item);
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`✨ All Done!`);
}

run();


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

// User requested variations. Since the text was specific, I'll use it as the base.
// To create "variations", I will slightly alter the phrasing while keeping the meaning identical as requested.
// Or actually, usually "variations" means the same intent but different wording.
// Text: "oii, Seja bem vindo ou bem vinda ao Cají assistente, nessa etapa precisamos que você adicione sua chave de api para que tudo funcione, caso não tenha uma ainda é só clicar no botão abaixo para ser redirecionado até a criação da sua chave, caso não saiba como criar uma veja o video abaixo, nesse video mostramos com detalhes como gerar a chave de api, quando estiver tudo pronto clique em continuar e daremos inicio na sua jornada"

const AUDIO_DATA = [
    {
        id: 'intro_apikey_v1',
        text: "Oi! Seja bem vindo ao Cají assistente. Nessa etapa, precisamos que você adicione sua chave de API para que tudo funcione. Caso não tenha uma ainda, é só clicar no botão abaixo para ser redirecionado até a criação da sua chave. Se não souber como criar, veja o vídeo abaixo onde mostramos os detalhes. Quando estiver tudo pronto, clique em continuar e daremos início na sua jornada."
    },
    {
        id: 'intro_apikey_v2',
        text: "Olá! Bem-vindo ao Cají assistente. Para começarmos, preciso que você insira sua chave de API e garanta o funcionamento do sistema. Se ainda não possui uma, clique no botão abaixo para criá-la. Também preparamos um vídeo explicativo logo abaixo com o passo a passo. Assim que tiver sua chave, clique em continuar para iniciarmos sua jornada."
    },
    {
        id: 'intro_apikey_v3',
        text: "Oi! Que bom ter você no Cají assistente. Para que tudo funcione perfeitamente, precisamos da sua chave de API agora. Se você ainda não tem, pode criar clicando no botão abaixo. Caso tenha dúvidas, o vídeo abaixo explica detalhadamente como gerar a chave. Com a chave em mãos, clique em continuar e vamos começar!"
    }
];

async function generateAudioItem(item) {
    const filePath = path.join(OUTPUT_DIR, `${item.id}.mp3`);

    if (fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping existing: ${item.id}.mp3`);
        return;
    }

    console.log(`🎙️  Generating: ${item.id} -> "${item.text.substring(0, 50)}..."`);

    try {
        const result = await generateAudio(item.text, 'Kore', API_KEY);
        fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
        console.log(`✅ Saved: ${item.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${item.id}:`, error.message);
    }
}

async function run() {
    console.log(`🚀 Starting API Key Audio Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    for (const item of AUDIO_DATA) {
        await generateAudioItem(item);
        // Delay to avoid rate limits (approx 12 RPM)
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`✨ All Done!`);
}

run();

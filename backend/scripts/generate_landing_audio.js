import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAudio } from '../src/services/ttsService.js';

// Load paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Env is expected to be loaded via node --env-file=.env or dotenv
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY or API_GEMINI not found in environment');
    process.exit(1);
}

const OUTPUT_DIR = path.resolve(rootDir, 'frontend/public/audio');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// The specific phrase requested
const audioItem = {
    id: 'agente_ia_demo',
    text: "Olá! Sou seu especialista em vendas. Como posso ajudar com os preços hoje?"
};

async function run() {
    console.log(`🚀 Starting Landing Page Audio Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    const filePath = path.join(OUTPUT_DIR, `${audioItem.id}.mp3`);

    // Always regenerate to ensure freshness if script is run manually
    console.log(`🎙️  Generating: ${audioItem.id} -> "${audioItem.text}"`);

    try {
        const result = await generateAudio(audioItem.text, 'Kore', API_KEY);

        // Ensure result.audioContent exists
        if (!result.audioContent) {
            throw new Error('No audio content received from service');
        }

        fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
        console.log(`✅ Saved: ${audioItem.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${audioItem.id}:`, error.message);
        if (error.cause) console.error(error.cause);
    }

    console.log(`✨ Done!`);
}

run();

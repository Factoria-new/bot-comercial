
import { generateAudio } from '../src/services/ttsService.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICES = ['Kore', 'Aoede', 'Zephyr', 'Charon', 'Fenrir', 'Puck'];
const TEXT = "Olá, eu sou a sua assistente virtual.";
const OUTPUT_DIR = path.join(__dirname, '../../frontend/public/voices');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateSamples() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment variables.');
        process.exit(1);
    }

    console.log(`🚀 Starting voice generation for ${VOICES.length} voices...`);

    for (const voice of VOICES) {
        try {
            console.log(`🎙️ Generating sample for ${voice}...`);
            const result = await generateAudio(TEXT, voice, apiKey);

            if (result && result.audioContent) {
                const buffer = Buffer.from(result.audioContent, 'base64');
                const filePath = path.join(OUTPUT_DIR, `${voice.toLowerCase()}.wav`); // ttsService returns wav
                fs.writeFileSync(filePath, buffer);
                console.log(`✅ Saved: ${filePath}`);
            } else {
                console.error(`❌ Failed to generate audio data for ${voice}`);
            }
        } catch (error) {
            console.error(`❌ Error generating ${voice}:`, error.message);
        }
    }

    console.log('✨ All done!');
}

generateSamples();

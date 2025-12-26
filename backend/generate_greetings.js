import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env parsing
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ API Key not found. Please check .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const GREETINGS = [
    {
        id: 'greeting_1',
        text: "Olá! Eu sou a Lia, sua especialista em criação de agentes. Estou aqui para entender o seu negócio e criar o melhor time de IA para você. Me conta, qual é o seu nicho de atuação?"
    },
    {
        id: 'greeting_2',
        text: "Oi, tudo bem? Aqui é a Lia. Vamos criar algo incrível para sua empresa hoje. Pra começar, me fala um pouco mais sobre o que você vende ou qual serviço oferece."
    },
    {
        id: 'greeting_3',
        text: "Bem-vindo! Eu sou a Lia. Minha missão é transformar suas necessidades em agentes de IA eficientes. Para eu ser bem assertiva, me diz: qual é o ramo da sua empresa?"
    }
];

const OUTPUT_DIR = path.resolve(__dirname, '../frontend/public/greetings');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to create WAV header
function createWavHeader(sampleRate, numChannels, bitsPerSample, dataLength) {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

async function generateAudio(id, text) {
    console.log(`🎤 Generating ${id}...`);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Kore',
                        },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (!audioData || !audioData.data) {
            throw new Error('No audio content generated');
        }

        let audioBuffer = Buffer.from(audioData.data, 'base64');

        // Check if we need to add WAV header (assuming raw PCM 24kHz for now if not WAV)
        // Gemini usually returns raw PCM or correct container depending on config, 
        // but 'gemini-2.0-flash-exp' audio output details might vary.
        // Let's assume it returns raw PCM 24kHz 1ch 16bit if mimeType is audio/pcm or similar.
        // Actually, let's look at mimeType.

        console.log(`   MimeType: ${audioData.mimeType}`);

        if (audioData.mimeType.includes('pcm') || audioData.mimeType.includes('raw') || !audioData.mimeType) {
            const wavHeader = createWavHeader(24000, 1, 16, audioBuffer.length);
            audioBuffer = Buffer.concat([wavHeader, audioBuffer]);
            console.log('   Converted PCM to WAV');
        }

        const filePath = path.join(OUTPUT_DIR, `${id}.wav`);
        fs.writeFileSync(filePath, audioBuffer);
        console.log(`✅ Saved to ${filePath}`);

    } catch (error) {
        console.error(`❌ Failed to generate ${id}:`, error);
    }
}

async function main() {
    for (const greeting of GREETINGS) {
        await generateAudio(greeting.id, greeting.text);
        // Wait 40s to respect rate limit
        console.log('Waiting 40s...');
        await new Promise(r => setTimeout(r, 40000));
    }
}

main();

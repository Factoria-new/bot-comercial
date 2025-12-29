
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Load paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendPublicDir = path.resolve(rootDir, 'frontend/public/audio/lia');

// Env (assumed loaded via --env-file)
const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not found');
    process.exit(1);
}

// Ensure directory exists
if (!fs.existsSync(frontendPublicDir)) {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
}

// Helper to create WAV header
function createWavHeader(sampleRate, numChannels, bitsPerSample, dataLength) {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    return buffer;
}

const AUDIO_DATA = [
    // INTRO
    { id: 'intro_wizard_v1', text: "Olá! Sou a Lia. Vamos configurar seu agente juntos." },
    { id: 'intro_wizard_v2', text: "Oi! Que bom te ver. Vamos criar um assistente incrível para você." },
    { id: 'intro_wizard_v3', text: "Bem-vindo! Eu sou a Lia. Vou te guiar nesse processo rápido." },

    // STEP IDENTITY
    { id: 'step_identity_v1', text: "Primeiro, me conte um pouco sobre sua empresa e quem será o assistente." },
    { id: 'step_identity_v2', text: "Vamos começar pelo básico: Qual o nome do seu negócio?" },
    { id: 'step_identity_v3', text: "Para começar, preciso saber o nome da empresa e como vamos chamar seu agente." },

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
    { id: 'help_assistant_name_v1', text: "Dê um nome para seu agente. Pode ser algo humanizado como 'Bia' ou 'João'." },
    { id: 'help_assistant_name_v2', text: "Escolha um nome amigável para seu assistente virtual." },
    { id: 'help_assistant_name_v3', text: "Como você quer que o assistente se apresente? Escolha um nome legal." },

    // COMPLETE
    { id: 'wizard_complete_v1', text: "Tudo pronto! Seu agente foi criado. Vamos testar?" },
    { id: 'wizard_complete_v2', text: "Parabéns! Finalizamos. Você já pode conversar com seu novo agente." },
    { id: 'wizard_complete_v3', text: "Excelente! Configurei tudo. Clique em testar para ver como ficou." }
];

async function generateAudio(item) {
    const filePath = path.join(frontendPublicDir, `${item.id}.mp3`);

    // Force overwrite
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    console.log(`🎙️  Generating (Kore): ${item.id} -> "${item.text}"`);

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts', // CORRECT MODEL
            contents: [{ parts: [{ text: item.text }] }],
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
            throw new Error('No audio content generated from Gemini TTS');
        }

        const rawPcmBuffer = Buffer.from(audioData.data, 'base64');
        // Gemini TTS usually returns 24kHz PCM
        const wavHeader = createWavHeader(24000, 1, 16, rawPcmBuffer.length);
        const wavBuffer = Buffer.concat([wavHeader, rawPcmBuffer]);

        fs.writeFileSync(filePath, wavBuffer);
        console.log(`✅ Saved: ${item.id}.mp3`);

    } catch (error) {
        console.error(`❌ Failed to generate ${item.id}:`, error.message);
        if (error.message.includes('429') || error.message.includes('quota')) {
            console.log("⚠️ Quota hit. Waiting 60s before retry...");
            await new Promise(r => setTimeout(r, 60000));
            return generateAudio(item); // Recursive retry
        }
    }
}

async function run() {
    console.log(`🚀 Starting Audio Asset Generation (Voice: Kore)...`);
    console.log(`📂 Output: ${frontendPublicDir}`);
    console.log(`⚠️  Note: Requests are spaced 35s apart to respect the 2 RPM quota.`);

    for (const item of AUDIO_DATA) {
        await generateAudio(item);
        console.log("⏳ Waiting 35s to respect rate limit...");
        await new Promise(r => setTimeout(r, 35000));
    }

    console.log(`✨ All Done!`);
}

run();

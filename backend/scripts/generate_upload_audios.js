
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateAudio } from '../src/services/ttsService.js';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const variations = [
    {
        filename: "upload_success_v1.mp3",
        text: "Recebi o prompt do seu agente e está tudo pronto. Se quiser ver como ele responde, é só clicar no botão 'Testar Agente' logo abaixo."
    },
    {
        filename: "upload_success_v2.mp3",
        text: "Prompt recebido e processado com sucesso! Agora você pode verificar as respostas dele clicando em 'Testar Agente'."
    },
    {
        filename: "upload_success_v3.mp3",
        text: "Tudo certo com o prompt do seu agente! O ambiente de teste está liberado. Clique no botão 'Testar Agente' para começar."
    },
    // New Integration Success Variations
    {
        filename: "integrations_success_v1.mp3",
        text: "Parabéns! Seu agente está pronto! Agora é hora de conectar ele às suas plataformas de atendimento. Escolha uma plataforma abaixo para começar."
    },
    {
        filename: "integrations_success_v2.mp3",
        text: "Excelente! Seu assistente está configurado. Vamos ativá-lo nas suas redes sociais? Escolha abaixo onde você quer que ele atenda seus clientes."
    },
    {
        filename: "integrations_success_v3.mp3",
        text: "Tudo certo! Agora só falta conectar seu agente. Selecione uma plataforma para ativar o atendimento automático."
    }
];

const outputDir = path.resolve(__dirname, '../../frontend/public/audio/lia');

if (!fs.existsSync(outputDir)) {
    console.error(`❌ Output directory does not exist: ${outputDir}`);
    // Create it?
    // fs.mkdirSync(outputDir, { recursive: true });
}

async function generateAll() {
    console.log(`Starting generation for ${variations.length} files...`);

    for (const v of variations) {
        try {
            console.log(`🎤 Generating: ${v.filename}...`);
            const result = await generateAudio(v.text, 'Kore', apiKey);

            const filePath = path.join(outputDir, v.filename);
            fs.writeFileSync(filePath, Buffer.from(result.audioContent, 'base64'));
            console.log(`✅ Saved to ${filePath}`);

            // Sleep to avoid rate limits?
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.error(`❌ Error generating ${v.filename}:`, error);
        }
    }
    console.log("Done!");
}

generateAll();

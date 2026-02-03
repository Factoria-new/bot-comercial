import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAudio } from '../src/services/ttsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolving path to frontend/public/audio/lia
const OUTPUT_DIR = path.resolve(__dirname, '../../frontend/public/audio/lia');

const PHRASES = {
    'step_operations': [
        "Agora, defina seu horário de atendimento e o link para onde o cliente será enviado, como seu contato ou agendamento.",
        "Estamos quase lá! Configure os horários que você trabalha e o link principal para finalizar o atendimento.",
        "Para finalizar a parte operacional, preciso saber seus horários e para onde devo levar o cliente quando ele quiser comprar ou agendar."
    ],
    'help_links': [ // Maps to 'focus_links'
        "Aqui você pode adicionar quantos links quiser. Não esqueça de colocar uma breve descrição para o Assistente saber quando usar cada um.",
        "Adicione seus links importantes aqui, como site, redes sociais ou agendamento. A descrição ajuda o Assistente a escolher o link certo.",
        "Use esse espaço para listar links úteis. Diga para o que serve cada um, assim o Assistente envia a informação correta para o cliente."
    ],
    'cta_plans': [
        "Gostou do que viu? Então não perca tempo. Confira nossos planos e escolha o ideal para transformar seu atendimento agora mesmo.",
        "Imagine esses resultados no seu negócio. Dê o próximo passo! Veja nossos planos e comece hoje a revolução no seu atendimento.",
        "Essa tecnologia está ao seu alcance. Clique no botão, veja nossos planos e descubra como é fácil ter um atendimento de ponta 24 horas por dia."
    ]
};

async function run() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ Missing GEMINI_API_KEY in environment");
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        console.log(`📁 Creating directory: ${OUTPUT_DIR}`);
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const [prefix, texts] of Object.entries(PHRASES)) {
        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const fileName = `${prefix}_v${i + 1}.mp3`;
            const filePath = path.join(OUTPUT_DIR, fileName);

            console.log(`🎤 Generating ${fileName}...`);
            try {
                // generateAudio returns { audioContent: base64, ... }
                const { audioContent } = await generateAudio(text, 'Kore', process.env.GEMINI_API_KEY);

                // Decode base64 and write to file
                fs.writeFileSync(filePath, Buffer.from(audioContent, 'base64'));
                console.log(`✅ Saved ${fileName}`);
            } catch (err) {
                console.error(`❌ Failed to generate ${fileName}:`, err.message);
                if (err.cause) console.error(err.cause);
            }
        }
    }
}

run();

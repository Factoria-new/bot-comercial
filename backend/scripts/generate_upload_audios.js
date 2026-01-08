
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
    { id: 'upload_success_v1', text: "Seu arquivo foi analisado com sucesso! Essa é a área de teste, onde você pode conversar com seu assistente para verificar como ele ficou." },
    { id: 'upload_success_v2', text: "Análise concluída! Já configurei seu assistente com base no arquivo. Aproveite este ambiente para testar as respostas dele." },
    { id: 'upload_success_v3', text: "Recebi e processei seu arquivo. Seu assistente está pronto para ser testado aqui nesta tela. Fique à vontade para fazer ajustes se precisar." },

    // Integrations (Intro Screen)
    { id: 'integrations_v1', text: "Parabéns! Seu assistente está pronto! Agora é hora de conectá-lo aos seus canais de atendimento. As integrações permitem que seu assistente responda automaticamente seus clientes em diferentes plataformas. Escolha uma opção abaixo para começar." },
    { id: 'integrations_v2', text: "Excelente! Seu assistente está configurado. Vamos ativá-lo nos seus canais de comunicação? Escolha abaixo onde você quer que ele atenda seus clientes." },
    { id: 'integrations_v3', text: "Tudo certo! Agora só falta conectar seu assistente. Selecione uma plataforma para ativar o atendimento automático nos seus canais." },

    // Integrations Success (After connecting)
    { id: 'integrations_success_v1', text: "Integração realizada! Seu assistente já está conectado e pronto." },
    { id: 'integrations_success_v2', text: "Conectado com sucesso! Agora seu assistente tem superpoderes." },
    { id: 'integrations_success_v3', text: "Pronto! Integração concluída. Vamos ver o assistente em ação?" },

    // Dashboard Suggestion
    { id: 'dashboard_suggestion_v1', text: "Seu painel está ativo! Dica rápida: que tal conectar também outros canais para centralizar todo o seu atendimento aqui?" },
    { id: 'dashboard_suggestion_v2', text: "Tudo pronto por aqui. Se quiser ampliar o alcance do seu assistente, sugiro conectar outros canais clicando em 'Gerenciar Integrações'." },
    { id: 'dashboard_suggestion_v3', text: "Bem-vindo ao seu Dashboard. Aproveite para explorar outras integrações e deixar seu assistente ainda mais completo em todos os seus canais." },

    // Step Details (Configuração Geral -> Produtos/Serviços)
    { id: 'step_details_v1', text: "Agora, me diga quais são seus principais produtos ou serviços. Preciso saber o nome e o preço ou uma breve descrição." },
    { id: 'step_details_v2', text: "Vamos cadastrar o que você vende. Adicione os itens principais para que eu possa oferecê-los aos seus clientes." },
    { id: 'step_details_v3', text: "Chegou a hora de adicionar seu catálogo. Liste seus produtos ou serviços com detalhes e valores." },

    // Wizard Complete (After manual creation)
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

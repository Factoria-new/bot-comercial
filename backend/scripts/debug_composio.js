import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.COMPOSIO_API_KEY;

if (!apiKey) {
    console.error('❌ COMPOSIO_API_KEY não encontrada no .env');
    process.exit(1);
}

const client = new Composio({ apiKey });

async function checkConnections(sessionId) {
    console.log(`\n🔍 Verificando conexões para SessionID: ${sessionId}`);

    try {
        const response = await client.connectedAccounts.list({
            userId: sessionId
        });

        let connections = [];
        if (Array.isArray(response)) {
            connections = response;
        } else if (response && Array.isArray(response.items)) {
            connections = response.items;
        } else if (response && Array.isArray(response.data)) {
            connections = response.data;
        }

        console.log(`📊 Total de conexões encontradas: ${connections.length}`);

        if (connections.length === 0) {
            console.log('⚠️ Nenhuma conexão encontrada.');
        }

        for (const conn of connections) {
            console.log('------------------------------------------------');
            console.log(`ID: ${conn.id}`);
            console.log(`App: ${conn.appName || conn.appUniqueId}`);
            console.log(`Toolkit Slug: ${conn.toolkit?.slug}`);
            console.log(`Status: ${conn.status}`);
            console.log(`Created: ${conn.createdAt}`);

            const isCalendar =
                (conn.toolkit && conn.toolkit.slug === 'googlecalendar') ||
                conn.appUniqueId === 'googlecalendar' ||
                conn.appName === 'googlecalendar';

            console.log(`✅ É Google Calendar? ${isCalendar ? 'SIM' : 'NÃO'}`);
        }
        console.log('------------------------------------------------\n');

    } catch (error) {
        console.error('❌ Erro ao listar conexões:', error.message);
    }
}

// Obter ID da linha de comando
const targetSessionId = process.argv[2];

if (!targetSessionId) {
    console.log('Uso: node debug_composio.js <instance_id>');
    console.log('Exemplo: node debug_composio.js instance_1765547787370');
} else {
    checkConnections(targetSessionId);
}

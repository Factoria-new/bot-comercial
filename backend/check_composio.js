import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import path from 'path';

// Carregar .env do diretório pai
dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.COMPOSIO_API_KEY;
console.log('Checking Composio tools...');
console.log('API Key present:', !!apiKey);

const composio = new Composio({
    apiKey: apiKey
});

async function checkTools() {
    try {
        console.log('Fetching Google Calendar tools...');
        // Tenta buscar a lista de apps ou tools
        const apps = await composio.apps.list();
        const calendarApp = apps.find(app => app.name.toLowerCase() === 'googlecalendar');

        if (calendarApp) {
            console.log('✅ Google Calendar App found:', calendarApp.name);
            console.log('Status:', calendarApp.status);
        } else {
            console.log('❌ Google Calendar App NOT found in available apps list.');
        }

        // Tenta listar as ações disponíveis para o Google Calendar
        console.log('\nFetching actions for Google Calendar...');
        const actions = await composio.actions.list({ appNames: ['googlecalendar'] });

        console.log('Available Actions:');
        actions.forEach(action => {
            console.log(`- ${action.name}`);
        });

    } catch (error) {
        console.error('❌ Error checking tools:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

checkTools();

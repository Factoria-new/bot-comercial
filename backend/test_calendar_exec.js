import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Tenta forçar a versão via ENV para testar a hipotese do README
process.env.COMPOSIO_TOOLKIT_VERSION_GOOGLECALENDAR = 'latest';

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY
});

async function testExecution() {
    try {
        console.log('Composio Object Keys:', Object.keys(composio));
        if (composio.apps) console.log('composio.apps exists');
        if (composio.actions) console.log('composio.actions exists');
        if (composio.tools) console.log('composio.tools exists');
        console.log('Attempting execution simulation with dangerouslySkipVersionCheck...');

        const combinations = [
            { version: 'latest', dangerouslySkipVersionCheck: true },
            { toolkit: { version: 'latest' }, dangerouslySkipVersionCheck: true }
        ];

        for (const meta of combinations) {
            console.log('Trying with meta:', JSON.stringify(meta));
            try {
                await composio.tools.execute(
                    'GOOGLECALENDAR_EVENTS_LIST',
                    { max_results: 1 },
                    {
                        connectedAccountId: 'mock-id',
                        ...meta
                    }
                );
            } catch (e) {
                console.log('-> Error:', e.message);
                if (e.message.includes('Toolkit version not specified')) {
                    console.log('   (Still missing version)');
                }
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testExecution();

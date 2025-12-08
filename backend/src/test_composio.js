import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Composio } from '@composio/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    try {
        const composioApiKey = process.env.COMPOSIO_API_KEY;
        const entityId = 'portob162@gmail.com';
        const connectedAccountId = 'ca_zMh--Pk2NEdL';

        const composio = new Composio({ apiKey: composioApiKey });
        const client = composio.client;

        // API requires BOTH entity_id AND connected_account_id
        console.log('=== Testing with entity_id + connected_account_id ===');

        const result = await client.tools.execute('GOOGLECALENDAR_GET_CURRENT_DATE_TIME', {
            entity_id: entityId,
            connected_account_id: connectedAccountId,
            arguments: {}
        });
        console.log('SUCCESS! Result:', JSON.stringify(result, null, 2));

    } catch (e) {
        console.error('\nError:', e.message);
    }
}

test();

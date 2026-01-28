import { Composio } from 'composio-core';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { googlecalendar: 'latest' }
});

async function run() {
    const userId = 'portob162@gmail.com';
    console.log(`Testing list filters for ${userId}...`);

    try {
        // 1. entityId
        try {
            const res1 = await composio.connectedAccounts.list({ entityId: userId, appName: 'googlecalendar' });
            console.log(`param 'entityId': Found ${res1.items.length} items`);
            if (res1.items.length > 0) console.log(` - ID: ${res1.items[0].id}`);
        } catch (e) { console.log('entityId failed', e.message); }

        // 2. user
        try {
            const res2 = await composio.connectedAccounts.list({ user: userId, appName: 'googlecalendar' });
            console.log(`param 'user': Found ${res2.items.length} items`);
        } catch (e) { console.log('user failed', e.message); }

        // 3. userId
        try {
            const res3 = await composio.connectedAccounts.list({ userId: userId, appName: 'googlecalendar' });
            console.log(`param 'userId': Found ${res3.items.length} items`);
        } catch (e) { console.log('userId failed', e.message); }

        // 4. entity
        try {
            const res4 = await composio.connectedAccounts.list({ entity: userId, appName: 'googlecalendar' });
            console.log(`param 'entity': Found ${res4.items.length} items`);
        } catch (e) { console.log('entity failed', e.message); }

        // 5. ownerId
        try {
            const res5 = await composio.connectedAccounts.list({ ownerId: userId, appName: 'googlecalendar' });
            console.log(`param 'ownerId': Found ${res5.items.length} items`);
        } catch (e) { console.log('ownerId failed', e.message); }

    } catch (e) {
        console.error("General Error:", e);
    }
}
run();

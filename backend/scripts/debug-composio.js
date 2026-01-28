import { Composio } from 'composio-core';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY
});

async function run() {
    console.log("Listing googlecalendar accounts...");
    try {
        const accounts = await composio.connectedAccounts.list({
            appName: 'googlecalendar'
        });
        console.log(`Found ${accounts.items?.length || 0} items.`);

        if (accounts.items && accounts.items.length > 0) {
            // Find one with an email if possible
            const item = accounts.items[0];
            console.log("First Item Keys:", Object.keys(item));
            console.log("First Item Full:", JSON.stringify(item, null, 2));
        } else {
            console.log("No items found. Trying without filter?");
            const all = await composio.connectedAccounts.list({});
            console.log(`Found ${all.items?.length || 0} total items.`);
            if (all.items?.length > 0) console.log("First Item Full:", JSON.stringify(all.items[0], null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
run();

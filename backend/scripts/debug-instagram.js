// Debug script to test Instagram API directly
import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260203_00' }
});

const connectionId = 'ca_BNevvQLIe7Xr'; // Updated from logs
const userId = 'portob162@gmail.com'; // User entity ID

async function debugInstagram() {
    console.log('🔍 Testing Instagram API directly...\n');

    try {
        // 1. Test connection
        console.log('1. Checking connection status...');
        const account = await composio.connectedAccounts.get(connectionId);
        console.log(`   Status: ${account.status}`);
        console.log(`   Metadata:`, account.metadata);

        // 4. List available actions
        console.log('\n4. Listing available actions for this connection...');
        try {
            // Get all actions for the Instagram app
            // Note: composio.getActions might not be the exact method signature depending on version
            // Trying to get actions from the app object
            const apps = await composio.apps.list();
            const instagramApp = apps.find(a => a.name.toLowerCase() === 'instagram' || a.key.toLowerCase() === 'instagram');

            if (instagramApp) {
                console.log('Found Instagram App:', instagramApp.key);
                // Some versions use actions.list({ appNames: [...] })
                const actions = await composio.actions.list({ appNames: ['instagram'] });

                console.log(`   Found ${actions.items?.length || actions.length} actions.`);
                const items = actions.items || actions;

                const userActions = items.filter(a =>
                    (a.name && a.name.toLowerCase().includes('user')) ||
                    (a.slug && a.slug.toLowerCase().includes('user')) ||
                    (a.name && a.name.toLowerCase().includes('profile')) ||
                    (a.slug && a.slug.toLowerCase().includes('profile')) ||
                    (a.name && a.name.toLowerCase().includes('account')) ||
                    (a.slug && a.slug.toLowerCase().includes('account'))
                );

                console.log('\n   User/Profile related actions:');
                userActions.forEach(a => {
                    console.log(`   - ${a.slug} (${a.description})`);
                });
            } else {
                console.log('Instagram app not found in list.');
            }

        } catch (e) {
            console.log(`   ❌ Error listing actions: ${e.message}`);
        }

        // 2. List conversations
        console.log('\n2. Listing conversations...');
        const convResult = await composio.tools.execute(
            'INSTAGRAM_LIST_ALL_CONVERSATIONS',
            {
                connectedAccountId: connectionId,
                userId: userId,
                arguments: { limit: 10 }
            }
        );

        console.log(`   Success: ${convResult.successful}`);
        console.log(`   Raw data:`, JSON.stringify(convResult.data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

debugInstagram();

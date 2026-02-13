// Unified Debug Script for Instagram (Consolidates debug-instagram*.js scripts)
import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: 'latest' }
});

// Configuration - Edit these as needed
const CONFIG = {
    userId: 'portob162@gmail.com',         // The user's email
    recipientId: '864456266429005',        // Target for DM testing
    connectionId: null,                    // Will be auto-detected
    testDirectAPI: false,                  // Set to true to test direct Graph API calls
    testSendDM: true,                      // Set to true to test sending DMs
    testUserInfo: true,                    // Set to true to test getting user info
    testListConvos: true                   // Set to true to test listing conversations
};

async function main() {
    console.log('🤖 Unified Instagram Debug Script');
    console.log('=================================');
    console.log(`User: ${CONFIG.userId}`);

    try {
        // 1. Connection Check
        console.log('\n1️⃣ Checking Connection...');
        const accounts = await composio.connectedAccounts.list({
            appName: 'instagram',
            entityId: CONFIG.userId
        });

        if (!accounts.items || accounts.items.length === 0) {
            console.error('❌ No Instagram connections found.');
            return;
        }

        const activeAccount = accounts.items.find(acc => acc.status === 'ACTIVE');
        if (!activeAccount) {
            console.error('❌ No ACTIVE connection found. Statuses:', accounts.items.map(a => a.status));
            return;
        }

        CONFIG.connectionId = activeAccount.id;
        console.log(`✅ Active Connection Found: ${CONFIG.connectionId}`);
        // console.log('Metadata:', activeAccount.metadata);

        // 2. Get User Info Tests (from debug-instagram-args.js & debug-instagram-no-version.js)
        if (CONFIG.testUserInfo) {
            console.log('\n2️⃣ Testing INSTAGRAM_GET_USER_INFO variations...');
            const variations = [
                { name: 'Standard (Empty Args)', args: {} },
                { name: 'With user_id=me', args: { user_id: 'me' } },
                { name: 'With latest version', args: {}, version: 'latest' }
            ];

            for (const v of variations) {
                console.log(`   👉 Testing: ${v.name}`);
                try {
                    const opts = {
                        connectedAccountId: CONFIG.connectionId,
                        arguments: v.args,
                        version: 'latest'
                    };
                    if (v.version) opts.version = v.version;

                    const result = await composio.tools.execute('INSTAGRAM_GET_USER_INFO', opts);
                    if (result.successful) {
                        console.log(`      ✅ Success: ID=${result.data.id || result.data.user_id}, Name=${result.data.username}`);
                    } else {
                        console.log(`      ❌ Failed: ${result.error}`);
                    }
                } catch (e) {
                    console.log(`      ❌ Exception: ${e.message}`);
                }
            }
        }

        // 3. List Conversations (from debug-instagram.js)
        if (CONFIG.testListConvos) {
            console.log('\n3️⃣ Testing INSTAGRAM_LIST_ALL_CONVERSATIONS...');
            try {
                const result = await composio.tools.execute('INSTAGRAM_LIST_ALL_CONVERSATIONS', {
                    connectedAccountId: CONFIG.connectionId,
                    arguments: { limit: 5 },
                    version: 'latest'
                });

                if (result.successful) {
                    const convs = result.data.data || result.data || [];
                    console.log(`   ✅ Success: Found ${convs.length} conversations`);
                    if (convs.length > 0) {
                        console.log(`   First conv ID: ${convs[0].id || convs[0].conversation_id}`);
                    }
                } else {
                    console.log(`   ❌ Failed: ${result.error}`);
                }
            } catch (e) {
                console.log(`   ❌ Exception: ${e.message}`);
            }
        }

        // 4. Send DM Tests (from debug-send.js)
        if (CONFIG.testSendDM && CONFIG.recipientId) {
            console.log(`\n4️⃣ Testing Send DM to ${CONFIG.recipientId}...`);

            // Test 1: With HUMAN_AGENT tag
            console.log('   👉 Attempt 1: With HUMAN_AGENT tag');
            try {
                const res1 = await composio.tools.execute('INSTAGRAM_SEND_TEXT_MESSAGE', {
                    connectedAccountId: CONFIG.connectionId,
                    arguments: {
                        recipient_id: CONFIG.recipientId,
                        text: "Debug Test (HUMAN_AGENT)",
                        tag: "HUMAN_AGENT"
                    },
                    version: 'latest'
                });
                console.log(`      Result: ${res1.successful ? '✅ Sent' : '❌ Failed (' + res1.error + ')'}`);
            } catch (e) {
                console.log(`      Exception: ${e.message}`);
            }

            // Test 2: WITHOUT tag
            console.log('   👉 Attempt 2: WITHOUT tag');
            try {
                const res2 = await composio.tools.execute('INSTAGRAM_SEND_TEXT_MESSAGE', {
                    connectedAccountId: CONFIG.connectionId,
                    arguments: {
                        recipient_id: CONFIG.recipientId,
                        text: "Debug Test (No Tag)"
                    },
                    version: 'latest'
                });
                console.log(`      Result: ${res2.successful ? '✅ Sent' : '❌ Failed (' + res2.error + ')'}`);
            } catch (e) {
                console.log(`      Exception: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
    }
}

main();

// Debug script to test Instagram API directly
import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260203_00' }
});

const connectionId = 'ca_4xClsgkiWvo_'; // From the logs
const userId = 'portob162@gmail.com'; // User entity ID

async function debugInstagram() {
    console.log('🔍 Testing Instagram API directly...\n');

    try {
        // 1. Test connection
        console.log('1. Checking connection status...');
        const account = await composio.connectedAccounts.get(connectionId);
        console.log(`   Status: ${account.status}`);
        console.log(`   Metadata:`, account.metadata);

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

        const conversations = convResult.data?.data || convResult.data || [];
        console.log(`   Found ${conversations.length} conversations`);

        // 3. Get messages from first conversation
        if (conversations.length > 0) {
            const firstConv = conversations[0];
            const convId = firstConv.id || firstConv.conversation_id;

            console.log(`\n3. Getting messages from conversation ${convId}...`);
            const msgResult = await composio.tools.execute(
                'INSTAGRAM_LIST_ALL_MESSAGES',
                {
                    connectedAccountId: connectionId,
                    userId: userId,
                    arguments: { conversation_id: convId, limit: 20 }
                }
            );

            console.log(`   Success: ${msgResult.successful}`);
            console.log(`   Raw data:`, JSON.stringify(msgResult.data, null, 2));

            const messages = msgResult.data?.data || msgResult.data?.messages || msgResult.data || [];
            console.log(`\n   Found ${messages.length} messages:`);

            for (const msg of messages) {
                const timestamp = msg.created_time || msg.timestamp || msg.created_at;
                const text = msg.message || msg.text || '';
                const senderId = msg.from?.id || msg.sender_id;
                console.log(`   - [${timestamp}] From ${senderId}: "${text.substring(0, 50)}..."`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

debugInstagram();

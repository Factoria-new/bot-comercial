// Debug script to test Sending Instagram DM directly
import { Composio } from '@composio/core';
import dotenv from 'dotenv';
import { sendDM } from '../src/services/instagramService.js';

dotenv.config();

// MOCK the status function called inside sendDM if difficult to import, 
// OR just copy the logic effectively. 
// Easier to test the Composio call directly first to isolate API issues.

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260203_00' }
});

const connectionId = 'ca_4xClsgkiWvo_'; // From previous logs
const userId = 'portob162@gmail.com';
const recipientId = '687988697641058'; // The user who sent "Oii" at 17:44

async function debugSend() {
    console.log('🔍 Testing Instagram Send DM directly...\n');

    try {
        console.log(`Sending to ${recipientId}...`);

        // Option A: Test exactly what the service does
        const result = await composio.tools.execute(
            'INSTAGRAM_SEND_TEXT_MESSAGE',
            {
                connectedAccountId: connectionId,
                userId: userId,
                arguments: {
                    recipient_id: recipientId,
                    text: "Teste de debug (HUMAN_AGENT)",
                    tag: "HUMAN_AGENT"
                }
            }
        );

        console.log(`   Success: ${result.successful}`);
        console.log(`   Raw data:`, JSON.stringify(result.data, null, 2));

        if (!result.successful) {
            console.error('   Error:', result.error);
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

debugSend();

// Debug script to test Instagram API with latest version
import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

// Initialize WITHOUT toolkitVersions
const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY
});

const connectionId = 'ca_BNevvQLIe7Xr'; // Updated from logs

async function debugInstagramLatest() {
    console.log('🔍 Testing Instagram API (Version: latest)...\n');

    try {
        // 4. Test Get User Info
        console.log('\n4. Testing Get User Info with version="latest"...');
        try {
            const userResult = await composio.tools.execute(
                'INSTAGRAM_GET_USER_INFO',
                {
                    connectedAccountId: connectionId,
                    version: 'latest', // Explicitly request latest
                    arguments: {}
                }
            );
            console.log(`   Success: ${userResult.successful}`);
            console.log(`   Data:`, JSON.stringify(userResult.data, null, 2));
        } catch (e) {
            console.log(`   ❌ Error calling INSTAGRAM_GET_USER_INFO: ${e.message}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugInstagramLatest();

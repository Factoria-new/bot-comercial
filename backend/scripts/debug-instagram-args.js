// Debug script to test Instagram API arguments
import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    toolkitVersions: { instagram: '20260203_00' }
});

const connectionId = 'ca_BNevvQLIe7Xr';
const userId = '17841480131547578'; // ID found in logs
const username = 'cajisolutionsofc'; // Username found in logs

async function debugInstagramArgs() {
    console.log('🔍 Testing INSTAGRAM_GET_USER_INFO arguments...\n');

    const testCases = [
        { name: 'Empty args', args: {} },
        { name: 'With user_id', args: { user_id: userId } },
        { name: 'With id', args: { id: userId } },
        { name: 'With username', args: { username: username } },
        { name: 'With user_name', args: { user_name: username } },
        { name: 'With query', args: { query: username } }
    ];

    for (const test of testCases) {
        console.log(`\nTesting: ${test.name}`);
        console.log(`Args:`, JSON.stringify(test.args));

        try {
            const result = await composio.tools.execute(
                'INSTAGRAM_GET_USER_INFO',
                {
                    connectedAccountId: connectionId,
                    arguments: test.args
                }
            );

            if (result.successful) {
                console.log(`✅ SUCCESS!`);
                console.log(`Data:`, JSON.stringify(result.data, null, 2));
                return; // Stop on first success
            } else {
                console.log(`❌ Failed:`, result.error);
                if (result.data) console.log(`Data:`, result.data);
            }
        } catch (e) {
            console.log(`❌ Exception: ${e.message}`);
        }
    }
}

debugInstagramArgs();

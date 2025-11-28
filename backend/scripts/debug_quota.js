import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

console.log('--- Debugging Quota Issue ---');
console.log(`API Key from .env: ${apiKey ? apiKey.substring(0, 8) + '...' : 'UNDEFINED'}`);

async function testCacheCreation() {
    if (!apiKey) {
        console.error('❌ No API Key found in .env');
        return;
    }

    try {
        const cacheManager = new GoogleAICacheManager(apiKey);
        const model = 'gemini-2.5-flash';
        const systemPrompt = 'This is a test prompt for cache quota verification. ' + 'A'.repeat(30000); // Increased to ensure > 1024 tokens

        console.log(`Attempting to create cache with model: ${model}`);

        const cache = await cacheManager.create({
            model: model,
            displayName: 'test_quota_cache',
            systemInstruction: systemPrompt,
            ttlSeconds: 300,
        });

        console.log('✅ Cache created successfully!');
        console.log(`Name: ${cache.name}`);

        // Cleanup
        await cacheManager.delete(cache.name);
        console.log('✅ Cache deleted successfully.');

    } catch (error) {
        console.error('❌ Error creating cache:');
        console.error(error.message);
        if (error.response) {
            console.error('Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

testCacheCreation();

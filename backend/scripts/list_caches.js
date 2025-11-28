import { GoogleAICacheManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listCaches() {
    if (!apiKey) {
        console.error('❌ No API Key found in .env');
        return;
    }

    try {
        const cacheManager = new GoogleAICacheManager(apiKey);
        console.log('🔍 Listing active caches...');

        const result = await cacheManager.list();

        if (!result.cachedContents || result.cachedContents.length === 0) {
            console.log('ℹ️ No active caches found.');
            return;
        }

        console.log(`✅ Found ${result.cachedContents.length} active cache(s):`);
        result.cachedContents.forEach((cache, index) => {
            console.log(`\n[${index + 1}] Name: ${cache.name}`);
            console.log(`    Model: ${cache.model}`);
            console.log(`    Display Name: ${cache.displayName}`);
            console.log(`    Create Time: ${cache.createTime}`);
            console.log(`    Expire Time: ${cache.expireTime}`);
        });

    } catch (error) {
        console.error('❌ Error listing caches:');
        console.error(error.message);
    }
}

listCaches();

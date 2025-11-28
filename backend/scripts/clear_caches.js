import { GoogleAICacheManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function clearCaches() {
    if (!apiKey) {
        console.error('❌ No API Key found in .env');
        return;
    }

    try {
        const cacheManager = new GoogleAICacheManager(apiKey);
        console.log('🔍 Listing active caches...');

        const result = await cacheManager.list();

        if (!result.cachedContents || result.cachedContents.length === 0) {
            console.log('ℹ️ No active caches found to delete.');
            return;
        }

        console.log(`⚠️ Found ${result.cachedContents.length} active cache(s). Deleting...`);

        for (const cache of result.cachedContents) {
            try {
                await cacheManager.delete(cache.name);
                console.log(`✅ Deleted: ${cache.name} (${cache.displayName})`);
            } catch (delError) {
                console.error(`❌ Failed to delete ${cache.name}: ${delError.message}`);
            }
        }

        console.log('🏁 Cleanup complete.');

    } catch (error) {
        console.error('❌ Error managing caches:');
        console.error(error.message);
    }
}

clearCaches();

// Script to list all available tools for Instagram
import { Composio } from '@composio/core';
import dotenv from 'dotenv';

dotenv.config();

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY
});

async function listTools() {
    console.log('🔍 Listing Instagram tools...\n');
    try {
        const tools = await composio.tools.get({
            apps: ['instagram']
        });

        console.log(`Found ${tools.length} tools:`);
        tools.forEach(tool => {
            console.log(`- ${tool.name}: ${tool.description}`);
        });

    } catch (error) {
        console.error('Error listing tools:', error.message);
    }
}

listTools();

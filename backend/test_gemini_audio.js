import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('No API Key');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testAudio() {
    console.log('Testing Audio Generation with gemini-2.5-flash-preview-tts...');
    try {
        // Trying the specific model name mentioned by the user
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Say "Hello"' }] }],
            generationConfig: { responseModalities: ["AUDIO"] }
        });

        const response = await result.response;
        console.log('Success! Audio Parts:', JSON.stringify(response.candidates[0].content.parts.length, null, 2));

    } catch (error) {
        console.error('Error with 2.5 TTS:', error.message);
        console.error(JSON.stringify(error, null, 2));
    }
}

testAudio();

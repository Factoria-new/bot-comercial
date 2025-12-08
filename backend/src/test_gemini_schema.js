
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const tool = {
    name: "googlecalendar_create_event",
    description: "Create a new event in Google Calendar",
    parameters: {
        type: "OBJECT",
        properties: {
            summary: { type: "STRING" },
            start: { type: "STRING" },
            end: { type: "STRING" }
        }
    }
};

async function test() {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp", // Tentar models conhecidos
            tools: [
                {
                    functionDeclarations: [tool]
                }
            ]
        });

        console.log('Chat initialized successfully with tool:', tool.name);

        // Tenta enviar uma mensagem simples para forçar a validação das tools
        const chat = model.startChat();
        const result = await chat.sendMessage("Hello");
        console.log('Response:', result.response.text());

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

test();

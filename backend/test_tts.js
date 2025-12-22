
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.API_GEMINI || process.env.GEMINI_API_KEY;

async function testTTS() {
    console.log("Testing Google TTS with Key:", API_KEY ? API_KEY.substring(0, 10) + '...' : 'NONE');

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    // Voice Config from our code
    const voiceConfig = {
        languageCode: 'pt-BR',
        name: 'pt-BR-Neural2-C' // Kore
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: { text: "Olá, este é um teste de voz da Kore." },
                voice: voiceConfig,
                audioConfig: { audioEncoding: 'MP3' },
            }),
        });

        if (!response.ok) {
            console.error(`Error status: ${response.status}`);
            console.error(`Error text: ${await response.text()}`);
        } else {
            const data = await response.json();
            console.log("Success! Audio content received (length):", data.audioContent.length);
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testTTS();

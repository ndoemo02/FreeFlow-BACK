// Przykład użycia Google Cloud Text-to-Speech z wybranym głosem Wavenet D
import "dotenv/config";
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

async function generateSpeech(text) {
    try {
        // Używamy klucza GOOGLE_TTS_API_KEY
        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        if (!apiKey) {
            throw new Error('Brak klucza GOOGLE_TTS_API_KEY');
        }

        const voice = {
            name: 'pl-PL-Wavenet-D',
            description: 'Żeński głos D (domyślny)'
        };

        console.log(`Generowanie mowy używając: ${voice.name} (${voice.description})`);
            
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const requestBody = {
            input: { text },
            voice: {
                languageCode: 'pl-PL',
                name: voice.name
            },
            audioConfig: {
                audioEncoding: 'MP3',
                effectsProfileId: ['large-home-entertainment-class-device'],
                pitch: 0,
                speakingRate: 1.0
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        
        // Dekodujemy Base64 do binarnego MP3
        const audioContent = Buffer.from(data.audioContent, 'base64');
        
        // Zapisujemy do pliku
        const fileName = `output.mp3`;
        await writeFile(fileName, audioContent, 'binary');
        console.log(`Audio zapisane do pliku: ${fileName}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Przykładowy tekst
const text = 'Dzień dobry, jak mogę Ci pomóc z realizacją zamówienia?';

// Uruchamiamy przykład
generateSpeech(text);
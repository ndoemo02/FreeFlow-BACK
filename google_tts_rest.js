// Przykład użycia Google Cloud Text-to-Speech z najlepszymi głosami
import "dotenv/config";
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

async function testGoogleTTS() {
    try {
        // Używamy klucza GOOGLE_TTS_API_KEY
        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        if (!apiKey) {
            throw new Error('Brak klucza GOOGLE_TTS_API_KEY');
        }

        // Tekst do konwersji
        const text = 'Proponuję restaurację Patio przy ulicy Stawowej 3 w Katowicach. Jaką potrawę wybierasz?';

        // Lista najlepszych głosów do przetestowania
        const voices = [
            { name: 'pl-PL-Wavenet-A', description: 'Żeński głos A' },
            { name: 'pl-PL-Wavenet-B', description: 'Męski głos B' },
            { name: 'pl-PL-Wavenet-C', description: 'Męski głos C' },
            { name: 'pl-PL-Wavenet-D', description: 'Żeński głos D' },
            { name: 'pl-PL-Wavenet-E', description: 'Żeński głos E' }
        ];

        // Generujemy próbki dla każdego głosu
        for (const voice of voices) {
            console.log(`Generowanie głosu: ${voice.name} (${voice.description})`);
            
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
            const fileName = `output_google_${voice.name}.mp3`;
            await writeFile(fileName, audioContent, 'binary');
            console.log(`Audio zapisane do pliku: ${fileName}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uruchamiamy przykład
testGoogleTTS();
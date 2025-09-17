// Przykład użycia Google Cloud Text-to-Speech z najlepszymi głosami
import "dotenv/config";
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

async function testGoogleTTS() {
    try {
        // Używamy klucza z GOOGLE_MAPS_API_KEY
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GMAPS_KEY;
        if (!apiKey) {
            throw new Error('Brak klucza GOOGLE_MAPS_API_KEY lub GMAPS_KEY');
        }

        // Tekst do konwersji
        const text = 'Proponuję restaurację Patio przy ulicy Stawowej 3 w Katowicach. Jaką potrawę wybierasz?';

        // Lista najlepszych głosów do przetestowania
        const voices = [
            { name: 'pl-PL-Wavenet-A', gender: 'FEMALE' },
            { name: 'pl-PL-Wavenet-B', gender: 'MALE' },
            { name: 'pl-PL-Wavenet-C', gender: 'MALE' },
            { name: 'pl-PL-Wavenet-D', gender: 'FEMALE' },
            { name: 'pl-PL-Wavenet-E', gender: 'FEMALE' },
            // Studio voices (Neural2)
            { name: 'pl-PL-Studio-A', gender: 'FEMALE' },
            { name: 'pl-PL-Studio-B', gender: 'MALE' },
            { name: 'pl-PL-Studio-C', gender: 'FEMALE' }
        ];

        // Generujemy próbki dla każdego głosu
        for (const voice of voices) {
            const request = {
                input: { text },
                voice: {
                    languageCode: 'pl-PL',
                    name: voice.name,
                    ssmlGender: voice.gender
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    effectsProfileId: ['large-home-entertainment-class-device'],
                    pitch: 0,
                    speakingRate: 1.0
                },
            };

            // Wykonujemy syntezę
            const [response] = await client.synthesizeSpeech(request);
            
            // Zapisujemy do pliku
            const fileName = `output_google_${voice.name}.mp3`;
            await writeFile(fileName, response.audioContent, 'binary');
            console.log(`Audio content written to file: ${fileName}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Uruchamiamy przykład
testGoogleTTS();
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../cache');
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 godziny

// Upewnij się, że katalog cache istnieje
async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

// Generuj hash dla tekstu i ustawień głosu
function generateCacheKey(text, voiceId, voiceSettings = {}) {
    const data = JSON.stringify({ text, voiceId, voiceSettings });
    return crypto.createHash('md5').update(data).digest('hex');
}

// Sprawdź czy plik jest w cache i czy nie jest zbyt stary
async function getCachedAudio(cacheKey) {
    try {
        const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
        const stats = await fs.stat(filePath);
        
        // Sprawdź wiek pliku
        if (Date.now() - stats.mtime.getTime() > MAX_CACHE_AGE) {
            await fs.unlink(filePath);
            return null;
        }

        return await fs.readFile(filePath);
    } catch {
        return null;
    }
}

// Zapisz audio w cache
async function cacheAudio(cacheKey, audioBuffer) {
    try {
        await ensureCacheDir();
        
        // Sprawdź i wyczyść cache jeśli przekracza limit
        await cleanCache();
        
        const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);
        await fs.writeFile(filePath, audioBuffer);
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

// Wyczyść stare pliki z cache jeśli przekracza limit rozmiaru
async function cleanCache() {
    try {
        const files = await fs.readdir(CACHE_DIR);
        let totalSize = 0;
        const fileStats = [];

        // Zbierz informacje o wszystkich plikach
        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            fileStats.push({ path: filePath, stats });
        }

        // Jeśli przekroczono limit, usuń najstarsze pliki
        if (totalSize > MAX_CACHE_SIZE) {
            fileStats.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());
            
            for (const file of fileStats) {
                if (totalSize <= MAX_CACHE_SIZE) break;
                
                await fs.unlink(file.path);
                totalSize -= file.stats.size;
            }
        }
    } catch (error) {
        console.error('Cache cleanup error:', error);
    }
}

export { generateCacheKey, getCachedAudio, cacheAudio };
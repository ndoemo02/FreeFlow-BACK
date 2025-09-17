# Instrukcja Migracji i Konfiguracji Głosów TTS

## Zmiany w Systemie
- Dodano obsługę wielu dostawców TTS (Google Cloud TTS i OpenAI TTS)
- Domyślny głos to Google Wavenet D (pl-PL-Wavenet-D)
- Dodano możliwość personalizacji głosu przez użytkowników

## Wymagane Zmienne Środowiskowe
```bash
# Wymagane w .env i na Vercel
GOOGLE_TTS_API_KEY=twój_klucz_google_tts
OPENAI_API_KEY=twój_klucz_openai
```

## Struktura Bazy Danych
Należy utworzyć nową tabelę `user_settings`:

```sql
create table user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  voice_provider text check (voice_provider in ('google', 'openai')),
  voice_id text not null,
  voice_settings jsonb default '{"speed": 1.0, "pitch": 0, "volume": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indeksy
create index user_settings_user_id_idx on user_settings(user_id);

-- Polityki bezpieczeństwa
alter table user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);
```

## Interfejs Użytkownika
1. Dodaj komponent `VoiceSettings` do panelu użytkownika
2. Zaimportuj typy z `voice-settings.ts`
3. Użyj kontekstu użytkownika do zarządzania ustawieniami

## Endpointy API
- `/api/tts` - obsługuje teraz oba dostawców TTS
- Parametry:
  - `voice_provider`: 'google' | 'openai'
  - `voice_id`: identyfikator głosu
  - `voice_settings`: ustawienia głosu (szybkość, wysokość, głośność)

## Testowanie
1. Sprawdź czy endpoint `/api/tts` działa z oboma dostawcami
2. Przetestuj różne głosy i ustawienia
3. Zweryfikuj zapisywanie ustawień użytkownika
4. Sprawdź wydajność i limity API

## Rozwiązywanie Problemów
- Problem z autoryzacją Google: Sprawdź uprawnienia klucza API
- Błąd 404 dla głosów: Zweryfikuj dostępne głosy w dokumentacji
- Problemy z zapisem ustawień: Sprawdź polityki Supabase
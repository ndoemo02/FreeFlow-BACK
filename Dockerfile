# Bazowy obraz Node.js
FROM node:18-alpine

# Ustawienie katalogu roboczego
WORKDIR /app

# Kopiowanie plików package*.json
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Kopiowanie kodu źródłowego
COPY . .

# Utworzenie katalogu na cache
RUN mkdir -p /app/cache

# Ustawienie zmiennych środowiskowych
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Uruchomienie aplikacji
CMD ["node", "server.new.js"]
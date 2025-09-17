import { createServer } from 'http';

const server = createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Otrzymano żądanie:`, {
        url: req.url,
        method: req.method,
        headers: req.headers
    });

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Serwer działa poprawnie\n');
});

server.on('error', (err) => {
    console.error('Błąd serwera:', err);
    if (err.code === 'EADDRINUSE') {
        console.error('Port 3002 jest już w użyciu. Proszę sprawdzić czy inny proces nie używa tego portu.');
    }
});

server.listen(3002, '127.0.0.1', () => {
    const address = server.address();
    console.log('========================================');
    console.log(`Serwer uruchomiony na http://${address.address}:${address.port}/`);
    console.log('Szczegóły połączenia:', address);
    console.log('========================================');
});
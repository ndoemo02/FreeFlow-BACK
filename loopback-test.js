import { createServer } from 'http';

const server = createServer((req, res) => {
    console.log('Received request:', req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('OK\n');
});

const PORT = 5000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
    console.log('Server details:', server.address());
});
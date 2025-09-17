import { createServer } from 'http';

const server = createServer((req, res) => {
    console.log('Received request:', req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('OK\n');
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Server details:', server.address());
});
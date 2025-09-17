import { createServer } from 'http';

const server = createServer((req, res) => {
    console.log('Received request:', req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('OK\n');
});

server.listen(3002, '127.0.0.1', () => {
    console.log('Server running at http://127.0.0.1:3002/');
    console.log('Server details:', server.address());
});
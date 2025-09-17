import http from 'http';

// Create a basic HTTP server
const server = http.createServer((req, res) => {
    // Log request details
    console.log('------------------');
    console.log('Received request:');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('------------------');

    // Send response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
});

// Add error handler
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Start listening
server.listen(3002, '127.0.0.1', () => {
    console.log('Test server is running on http://127.0.0.1:3002');
    console.log('IP and port configuration:');
    console.log(server.address());
});
import express from 'express';
const app = express();

app.get('/test', (req, res) => {
    console.log('Received test request');
    res.json({ status: 'ok' });
});

const port = 3002;
app.listen(port, '127.0.0.1', () => {
    console.log(`Test server running on http://127.0.0.1:${port}`);
});
import express from 'express';
const app = express();

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ status: 'ok' });
});

app.listen(8888, '0.0.0.0', () => {
    console.log('Test server running on http://localhost:8888');
});
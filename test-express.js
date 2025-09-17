import express from 'express';

const app = express();

app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ status: 'ok' });
});

app.listen(3002, '127.0.0.1', () => {
    console.log('Express server running at http://127.0.0.1:3002/');
});
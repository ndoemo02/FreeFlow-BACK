import express from 'express';

const app = express();
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, '0.0.0.0', (error) => {
  if (error) {
    console.error('Error starting server:', error);
    return;
  }
  console.log('Test server running on http://localhost:3000');
});
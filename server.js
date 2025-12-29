import app from './functions/app.js';

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});

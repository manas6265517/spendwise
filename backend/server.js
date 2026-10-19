const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const transactionRoutes = require('./src/routes/transactions'); // <-- Imported here

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); // <-- Registered here

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpendWise API is running smoothly' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
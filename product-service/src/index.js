require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const productRoutes = require('./routes/product.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

app.use('/api/products', productRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('[product-service] Connected to MongoDB');
    await require('./utils/seeder').seedProducts();
    app.listen(PORT, () => console.log(`[product-service] Running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[product-service] MongoDB connection error:', err.message);
    process.exit(1);
  });

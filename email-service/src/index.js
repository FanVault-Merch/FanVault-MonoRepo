require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const emailRoutes = require('./routes/email.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '50kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'email-service' }));

app.use('/api/email', emailRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`[email-service] Running on port ${PORT}`));

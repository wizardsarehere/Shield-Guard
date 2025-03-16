const express = require('express');
const { ShieldGuard } = require('./dist');

const app = express();

const shield = new ShieldGuard({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  banTime: 30 * 60 * 1000,
  message: {
    error: true,
    status: 429,
    message: 'You have sent too many requests',
    details: {
      limit: 100,
      windowInMinutes: 15
    }
  },
  enableLogging: true,
  logLevel: 'info',
  logHandler: (log) => {
    console.log(`[${log.type}] IP: ${log.ip}, Situation: ${log.hits}/${log.limit} request`);
  },
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Limit',
    retryAfter: 'Retry-After'
  },
  burstLimit: 5,
  burstTime: 1000,
  proxyValidation: true,
  blockByUserAgent: true,
  allowedUserAgents: [
    'Mozilla',
    'Chrome',
    'Safari',
    'Firefox',
    'Edge',
    'Opera'
  ]
});

app.use(shield.middleware());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public API endpoint' });
});

app.get('/api/protected', (req, res) => {
  res.json({ message: 'Protected API endpoint' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
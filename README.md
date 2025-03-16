# Shield Guard 🛡️

Advanced rate limiting middleware for Node.js applications with enterprise-grade features and flexible configuration options.

## ✨ Key Features

- 🚀 **High Performance**: Optimized for minimal latency and maximum throughput
- 🔄 **Distributed Rate Limiting**: Seamless coordination across multiple nodes
- 🎯 **Smart Burst Handling**: Intelligent traffic spike management
- 🌍 **Geolocation Protection**: Block or allow requests based on country
- 🕵️ **Advanced Security**: Proxy validation and user agent filtering
- 📊 **Detailed Monitoring**: Comprehensive logging and analytics
- 🎨 **Flexible Configuration**: Highly customizable for any use case
- 🔌 **Framework Agnostic**: Works with Express, Fastify, Koa, and more
- 💾 **Multiple Storage Backends**: Memory, Redis, MongoDB, and custom stores
- 🛠️ **Developer Friendly**: TypeScript support and extensive documentation
- ⏰ **Ban System**: Temporary IP banning for excessive requests
- 🔍 **Request Analysis**: Track and analyze request patterns
- 🌐 **CDN Support**: Compatible with major CDN providers
- 🔒 **Rate Limit by Path**: Different limits for different endpoints

## 📦 Installation

```bash
npm install shield-guard
```

## 🚀 Quick Start

```typescript
import express from 'express';
import { ShieldGuard } from 'shield-guard';

const app = express();

const shield = new ShieldGuard({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,               // Limit each IP to 100 requests per window
  banTime: 30 * 60 * 1000, // Ban for 30 minutes after limit exceeded
  message: {
    error: true,
    status: 429,
    message: 'Too many requests',
    details: {
      limit: 100,
      windowInMinutes: 15
    }
  }
});

app.use(shield.middleware());
```

## 🛠️ Advanced Configuration

### Ban System Configuration

```typescript
const shield = new ShieldGuard({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  banTime: 60 * 60 * 1000, // 1 hour ban
  onBan: async (req, res) => {
    await logBannedIP(req.ip);
    res.status(403).json({
      error: 'IP banned',
      banExpiration: new Date(Date.now() + 60 * 60 * 1000)
    });
  }
});
```

### Path-Specific Rate Limits

```typescript
const shield = new ShieldGuard({
  windowMs: 60 * 1000, // 1 minute
  limit: (req) => {
    switch (req.path) {
      case '/api/auth':
        return 5;  // 5 login attempts per minute
      case '/api/search':
        return 30; // 30 searches per minute
      default:
        return 100; // Default limit
    }
  }
});
```

### Advanced Security with Headers

```typescript
const shield = new ShieldGuard({
  proxyValidation: true,
  blockByUserAgent: true,
  allowedUserAgents: ['Mozilla', 'Chrome', 'Safari', 'Edge'],
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Limit',
    retryAfter: 'Retry-After',
    banExpire: 'X-Ban-Expires'
  }
});
```

### Redis Store with Clustering

```typescript
const shield = new ShieldGuard({
  store: new RedisStore({
    client: redis.createCluster({
      nodes: [
        { host: 'localhost', port: 6379 },
        { host: 'localhost', port: 6380 }
      ]
    }),
    prefix: 'shield:',
    syncInterval: 1000
  }),
  distributed: true
});
```

### Advanced Monitoring

```typescript
const shield = new ShieldGuard({
  enableLogging: true,
  logLevel: 'info',
  logHandler: (log) => {
    console.log(`[${log.type}] IP: ${log.ip}`);
    console.log(`Path: ${log.path}`);
    console.log(`Rate: ${log.hits}/${log.limit}`);
    console.log(`User Agent: ${log.userAgent}`);
    if (log.banExpiration) {
      console.log(`Ban Expires: ${new Date(log.banExpiration)}`);
    }
  }
});
```

### Dynamic Response Messages

```typescript
const shield = new ShieldGuard({
  message: async (req) => {
    const timeLeft = await getRemainingTime(req.ip);
    return {
      error: true,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      details: {
        timeLeft: timeLeft,
        nextTry: new Date(Date.now() + timeLeft),
        path: req.path,
        method: req.method
      }
    };
  }
});
```

## 📊 Monitoring and Analytics

Shield Guard provides detailed metrics for monitoring:

- Request counts per IP
- Ban events and durations
- Rate limit violations
- Geographic distribution of requests
- Response times and latency
- Burst detection events

### Prometheus Integration

```typescript
const shield = new ShieldGuard({
  metrics: {
    enable: true,
    prometheus: true,
    prefix: 'shield_guard_',
    labels: ['path', 'method', 'status']
  }
});
```

## 🔧 API Reference

### ShieldOptions

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `windowMs` | `number` | Time window for rate limiting | `60000` |
| `limit` | `number \| function` | Request limit per window | `100` |
| `banTime` | `number` | Ban duration in ms | `1800000` |
| `statusCode` | `number` | HTTP status code | `429` |
| `message` | `string \| object \| function` | Response message | `'Too many requests'` |
| `headers` | `object` | Custom headers | `{}` |
| `store` | `Store` | Storage backend | `MemoryStore` |
| `distributed` | `boolean` | Enable distribution | `false` |
| `burstLimit` | `number` | Burst limit | `0` |
| `burstTime` | `number` | Burst window | `1000` |
| `blockByCountry` | `boolean` | Geo-blocking | `false` |
| `proxyValidation` | `boolean` | Validate proxies | `false` |
| `enableLogging` | `boolean` | Enable logging | `false` |

## 🌟 Best Practices

1. **Configure Ban System**
   ```typescript
   const shield = new ShieldGuard({
     banTime: 30 * 60 * 1000,
     onBan: async (req) => {
       await notifyAdmin(req.ip);
     }
   });
   ```

2. **Use Custom Storage for Production**
   ```typescript
   const shield = new ShieldGuard({
     store: new RedisStore(),
     distributed: true,
     syncInterval: 1000
   });
   ```

3. **Implement Path-Specific Limits**
   ```typescript
   const shield = new ShieldGuard({
     limit: (req) => {
       return req.path.startsWith('/api') ? 50 : 100;
     }
   });
   ```

4. **Enable Comprehensive Logging**
   ```typescript
   const shield = new ShieldGuard({
     enableLogging: true,
     logLevel: 'info',
     logHandler: customLogHandler
   });
   ```

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## 📝 License

MIT © Shield Guard Contributors
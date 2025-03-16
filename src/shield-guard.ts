import { ShieldOptions, Store, HitInfo } from './types';
import { MemoryStore } from './stores/memory';

const defaultOptions: Partial<ShieldOptions> = {
  windowMs: 60 * 1000, // 1 minute
  limit: 100,
  statusCode: 429,
  message: 'Too many requests, please try again later.',
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Limit',
    retryAfter: 'Retry-After'
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  distributed: false,
  syncInterval: 5000,
  burstLimit: 0,
  burstTime: 1000
};

export class ShieldGuard {
  private options: ShieldOptions;
  private store: Store;

  constructor(options: Partial<ShieldOptions> = {}) {
    this.options = { ...defaultOptions, ...options } as ShieldOptions;
    this.store = options.store || new MemoryStore(this.options.windowMs);
    this.init();
  }

  private async init() {
    await this.store.init();
  }

  private async getKey(req: any): Promise<string> {
    if (this.options.keyGenerator) {
      return await Promise.resolve(this.options.keyGenerator(req));
    }
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }

  private async getLimit(req: any): Promise<number> {
    if (typeof this.options.limit === 'function') {
      return await Promise.resolve(this.options.limit(req));
    }
    return this.options.limit;
  }

  private shouldSkip(req: any): boolean {
    if (this.options.skipPaths?.includes(req.path)) return true;
    if (this.options.skipMethods?.includes(req.method)) return true;
    return false;
  }

  private setHeaders(req: any, res: any, info: HitInfo, limit: number) {
    const headers = this.options.headers;
    if (!headers) return;

    if (headers.remaining) {
      res.setHeader(headers.remaining, Math.max(0, limit - info.hits));
    }
    if (headers.reset) {
      res.setHeader(headers.reset, Math.ceil(info.resetTime / 1000));
    }
    if (headers.total) {
      res.setHeader(headers.total, limit);
    }
    if (headers.retryAfter && info.hits > limit) {
      res.setHeader(headers.retryAfter, Math.ceil((info.resetTime - Date.now()) / 1000));
    }
  }

  public middleware() {
    return async (req: any, res: any, next: Function) => {
      if (this.shouldSkip(req)) {
        return next();
      }

      try {
        const key = await this.getKey(req);
        const limit = await this.getLimit(req);
        const info = await this.store.increment(key);

        this.setHeaders(req, res, info, limit);

        if (info.hits > limit) {
          if (this.options.onRateLimit) {
            await Promise.resolve(this.options.onRateLimit(req, res));
          } else if (this.options.handler) {
            await Promise.resolve(this.options.handler(req, res));
          } else {
            res.status(this.options.statusCode || 429);
            res.send(this.options.message || 'Too many requests');
          }
          return;
        }

        const originalEnd = res.end;
        res.end = async (...args: any[]) => {
          if (this.options.skipSuccessfulRequests && res.statusCode < 400) {
            await this.store.decrement(key);
          }
          if (this.options.skipFailedRequests && res.statusCode >= 400) {
            await this.store.decrement(key);
          }
          originalEnd.apply(res, args);
        };

        next();
      } catch (error) {
        if (this.options.storeErrorHandler) {
          this.options.storeErrorHandler(error as Error);
        }
        next(error);
      }
    };
  }
}
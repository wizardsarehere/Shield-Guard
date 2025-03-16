"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShieldGuard = void 0;
const memory_1 = require("./stores/memory");
const defaultOptions = {
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
class ShieldGuard {
    constructor(options = {}) {
        this.options = { ...defaultOptions, ...options };
        this.store = options.store || new memory_1.MemoryStore(this.options.windowMs);
        this.init();
    }
    async init() {
        await this.store.init();
    }
    async getKey(req) {
        if (this.options.keyGenerator) {
            return await Promise.resolve(this.options.keyGenerator(req));
        }
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    }
    async getLimit(req) {
        if (typeof this.options.limit === 'function') {
            return await Promise.resolve(this.options.limit(req));
        }
        return this.options.limit;
    }
    shouldSkip(req) {
        var _a, _b;
        if ((_a = this.options.skipPaths) === null || _a === void 0 ? void 0 : _a.includes(req.path))
            return true;
        if ((_b = this.options.skipMethods) === null || _b === void 0 ? void 0 : _b.includes(req.method))
            return true;
        return false;
    }
    setHeaders(req, res, info, limit) {
        const headers = this.options.headers;
        if (!headers)
            return;
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
    middleware() {
        return async (req, res, next) => {
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
                    }
                    else if (this.options.handler) {
                        await Promise.resolve(this.options.handler(req, res));
                    }
                    else {
                        res.status(this.options.statusCode || 429);
                        res.send(this.options.message || 'Too many requests');
                    }
                    return;
                }
                const originalEnd = res.end;
                res.end = async (...args) => {
                    if (this.options.skipSuccessfulRequests && res.statusCode < 400) {
                        await this.store.decrement(key);
                    }
                    if (this.options.skipFailedRequests && res.statusCode >= 400) {
                        await this.store.decrement(key);
                    }
                    originalEnd.apply(res, args);
                };
                next();
            }
            catch (error) {
                if (this.options.storeErrorHandler) {
                    this.options.storeErrorHandler(error);
                }
                next(error);
            }
        };
    }
}
exports.ShieldGuard = ShieldGuard;

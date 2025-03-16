export interface ShieldOptions {
    windowMs: number;
    limit: number | ((req: any) => number | Promise<number>);
    banTime?: number;
    statusCode?: number;
    message?: string | object | ((req: any) => string | object | Promise<string | object>);
    headers?: {
        remaining?: string;
        reset?: string;
        total?: string;
        retryAfter?: string;
        banExpire?: string;
    };
    store?: Store;
    storeErrorHandler?: (error: Error) => void;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    skipPaths?: string[];
    skipMethods?: string[];
    skipIPs?: string[];
    trustProxy?: boolean;
    keyGenerator?: (req: any) => string | Promise<string>;
    handler?: (req: any, res: any) => void | Promise<void>;
    onRateLimit?: (req: any, res: any) => void | Promise<void>;
    onBan?: (req: any, res: any) => void | Promise<void>;
    onSuccess?: (req: any, res: any) => void | Promise<void>;
    distributed?: boolean;
    syncInterval?: number;
    burstLimit?: number;
    burstTime?: number;
    proxyValidation?: boolean;
    blockByUserAgent?: boolean;
    allowedUserAgents?: string[];
    blockByCountry?: boolean;
    allowedCountries?: string[];
    enableLogging?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    logHandler?: (log: LogEntry) => void;
}
export interface Store {
    init(): Promise<void>;
    increment(key: string): Promise<HitInfo>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    cleanup(): Promise<void>;
    ban(key: string, duration: number): Promise<void>;
    isBanned(key: string): Promise<boolean>;
    getBanExpiration(key: string): Promise<number | null>;
}
export interface HitInfo {
    hits: number;
    resetTime: number;
    remaining: number;
    firstHit?: number;
    lastHit?: number;
    userAgent?: string;
    country?: string;
    banExpiration?: number;
}
export interface LogEntry {
    timestamp: number;
    type: 'rateLimit' | 'success' | 'error' | 'ban';
    ip: string;
    userAgent?: string;
    path?: string;
    hits: number;
    limit: number;
    remaining: number;
    banExpiration?: number;
}

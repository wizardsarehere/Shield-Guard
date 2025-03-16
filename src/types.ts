export interface ShieldOptions {
  // Basic configuration
  windowMs: number;
  limit: number | ((req: any) => number | Promise<number>);
  banTime?: number; // Ban süresi (ms cinsinden)
  
  // Response configuration
  statusCode?: number;
  message?: string | object | ((req: any) => string | object | Promise<string | object>);
  
  // Headers configuration
  headers?: {
    remaining?: string;
    reset?: string;
    total?: string;
    retryAfter?: string;
    banExpire?: string;
  };
  
  // Storage configuration
  store?: Store;
  storeErrorHandler?: (error: Error) => void;
  
  // Advanced features
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skipPaths?: string[];
  skipMethods?: string[];
  skipIPs?: string[];
  trustProxy?: boolean;
  
  // Custom handlers
  keyGenerator?: (req: any) => string | Promise<string>;
  handler?: (req: any, res: any) => void | Promise<void>;
  onRateLimit?: (req: any, res: any) => void | Promise<void>;
  onBan?: (req: any, res: any) => void | Promise<void>;
  onSuccess?: (req: any, res: any) => void | Promise<void>;
  
  // Distributed system support
  distributed?: boolean;
  syncInterval?: number;
  
  // Burst configuration
  burstLimit?: number;
  burstTime?: number;
  
  // Advanced protection
  proxyValidation?: boolean;
  blockByUserAgent?: boolean;
  allowedUserAgents?: string[];
  blockByCountry?: boolean;
  allowedCountries?: string[];
  
  // Monitoring and logging
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
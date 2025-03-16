import { Store, HitInfo } from '../types';

export class MemoryStore implements Store {
  private storage: Map<string, HitInfo>;
  private cleanupInterval: NodeJS.Timeout | null;
  private bannedKeys: Map<string, number>;

  constructor(private windowMs: number) {
    this.storage = new Map();
    this.cleanupInterval = null;
    this.bannedKeys = new Map();
  }

  async init(): Promise<void> {
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }

  async increment(key: string): Promise<HitInfo> {
    const now = Date.now();
    const resetTime = now + this.windowMs;
    
    const current = this.storage.get(key);
    if (!current || current.resetTime < now) {
      const info: HitInfo = {
        hits: 1,
        resetTime,
        remaining: Infinity
      };
      this.storage.set(key, info);
      return info;
    }

    current.hits++;
    return current;
  }

  async decrement(key: string): Promise<void> {
    const current = this.storage.get(key);
    if (current) {
      current.hits = Math.max(0, current.hits - 1);
    }
  }

  async reset(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, info] of this.storage.entries()) {
      if (info.resetTime < now) {
        this.storage.delete(key);
      }
    }

    // Clean up expired bans
    for (const [key, expiration] of this.bannedKeys.entries()) {
      if (expiration < now) {
        this.bannedKeys.delete(key);
      }
    }
  }

  async ban(key: string, duration: number): Promise<void> {
    const expiration = Date.now() + duration;
    this.bannedKeys.set(key, expiration);
  }

  async isBanned(key: string): Promise<boolean> {
    const expiration = this.bannedKeys.get(key);
    if (!expiration) return false;
    
    if (expiration < Date.now()) {
      this.bannedKeys.delete(key);
      return false;
    }
    
    return true;
  }

  async getBanExpiration(key: string): Promise<number | null> {
    const expiration = this.bannedKeys.get(key);
    if (!expiration) return null;
    
    if (expiration < Date.now()) {
      this.bannedKeys.delete(key);
      return null;
    }
    
    return expiration;
  }
}
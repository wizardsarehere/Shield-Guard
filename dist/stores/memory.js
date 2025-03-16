"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
class MemoryStore {
    constructor(windowMs) {
        this.windowMs = windowMs;
        this.storage = new Map();
        this.cleanupInterval = null;
        this.bannedKeys = new Map();
    }
    async init() {
        this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
    }
    async increment(key) {
        const now = Date.now();
        const resetTime = now + this.windowMs;
        const current = this.storage.get(key);
        if (!current || current.resetTime < now) {
            const info = {
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
    async decrement(key) {
        const current = this.storage.get(key);
        if (current) {
            current.hits = Math.max(0, current.hits - 1);
        }
    }
    async reset(key) {
        this.storage.delete(key);
    }
    async cleanup() {
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
    async ban(key, duration) {
        const expiration = Date.now() + duration;
        this.bannedKeys.set(key, expiration);
    }
    async isBanned(key) {
        const expiration = this.bannedKeys.get(key);
        if (!expiration)
            return false;
        if (expiration < Date.now()) {
            this.bannedKeys.delete(key);
            return false;
        }
        return true;
    }
    async getBanExpiration(key) {
        const expiration = this.bannedKeys.get(key);
        if (!expiration)
            return null;
        if (expiration < Date.now()) {
            this.bannedKeys.delete(key);
            return null;
        }
        return expiration;
    }
}
exports.MemoryStore = MemoryStore;

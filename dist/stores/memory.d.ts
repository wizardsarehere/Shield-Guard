import { Store, HitInfo } from '../types';
export declare class MemoryStore implements Store {
    private windowMs;
    private storage;
    private cleanupInterval;
    private bannedKeys;
    constructor(windowMs: number);
    init(): Promise<void>;
    increment(key: string): Promise<HitInfo>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    cleanup(): Promise<void>;
    ban(key: string, duration: number): Promise<void>;
    isBanned(key: string): Promise<boolean>;
    getBanExpiration(key: string): Promise<number | null>;
}

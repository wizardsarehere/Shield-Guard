import { ShieldOptions } from './types';
export declare class ShieldGuard {
    private options;
    private store;
    constructor(options?: Partial<ShieldOptions>);
    private init;
    private getKey;
    private getLimit;
    private shouldSkip;
    private setHeaders;
    middleware(): (req: any, res: any, next: Function) => Promise<any>;
}

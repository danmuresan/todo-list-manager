import type { Router } from 'express';
import StorageService, { storageService } from '../services/storage-service';
import SseService, { sse } from '../sse';

export interface Services {
	storage: StorageService;
	sse: SseService;
}

export class Container implements Services {
    public readonly storage: StorageService;
    public readonly sse: SseService;

    public constructor(overrides?: Partial<Services>) {
    this.storage = overrides?.storage ?? storageService;
        this.sse = overrides?.sse ?? sse;
    }
}

export type RouterFactory = (services: Services) => Router;

export const container = new Container();

import type { Router } from 'express';
import { storageService } from '../services/storage-service';
import { sse } from '../services/sse-service';
import type { IStorageService } from '../services/abstractions/storage-service-abstraction';
import type { ISseService } from '../services/abstractions/sse-service-abstraction';
import type { ILogger } from '../services/abstractions/logger-abstraction';
import { logger } from '../services/logger';
import { DIContainerManager } from './di-container-manager';
import { IDIContainerManager } from './abstractions/di-container-manager-abstraction';

export interface AppDependencies {
    storage: IStorageService;
    sse: ISseService;
    logger: ILogger;
}

// Build a factory-based DI manager and register service factories.
const manager: IDIContainerManager = new DIContainerManager();

// Register services
manager.register<IStorageService>('storage', () => storageService);
manager.register<ISseService>('sse', () => sse);
manager.register<ILogger>('logger', () => logger);

// Optionally expose a helper to create an AppDependencies bundle from the manager.
export function createDependenciesContainer(): AppDependencies {
    return {
        storage: manager.resolve<IStorageService>('storage'),
        sse: manager.resolve<ISseService>('sse'),
    logger: manager.resolve<ILogger>('logger'),
    };
}

export type RouterFactory = (deps: AppDependencies) => Router;

// Default container for application use.
export const container: AppDependencies = createDependenciesContainer();

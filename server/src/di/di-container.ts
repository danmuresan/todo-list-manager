import type { Router } from 'express';
import { storageService } from '../services/storage-service';
import { sse } from '../services/sse-service';
import type { IStorageService } from '../services/abstractions/storage-service-abstraction';
import type { ISseService } from '../services/abstractions/sse-service-abstraction';
import type { ILogger } from '../services/abstractions/logger-abstraction';
import { logger } from '../services/logger';
import { DIContainerManager } from './di-container-manager';
import { IDIContainerManager } from './abstractions/di-container-manager-abstraction';
import { StorageRepository } from '../services/storage-repository';
import type { TodoItem } from '../models/todo-item';
import type { TodoList } from '../models/todo-list';
import type { User } from '../models/user';

/**
 * Application-level dependencies.
 */
export interface AppDependencies {
    storage: IStorageService;
    sse: ISseService;
    logger: ILogger;
    todoItemsRepo: StorageRepository<TodoItem>;
    todoListsRepo: StorageRepository<TodoList>;
    usersRepo: StorageRepository<User>;
}

// Build a factory-based DI manager and register service factories.
const manager: IDIContainerManager = new DIContainerManager();

// Register services
manager.register<IStorageService>('storage', () => storageService);
manager.register<ISseService>('sse', () => sse);
manager.register<ILogger>('logger', () => logger);
manager.register<StorageRepository<TodoItem>>('todoItemsRepo', () => new StorageRepository<TodoItem>(storageService, (db) => db.todos));
manager.register<StorageRepository<TodoList>>('todoListsRepo', () => new StorageRepository<TodoList>(storageService, (db) => db.lists));
manager.register<StorageRepository<User>>('usersRepo', () => new StorageRepository<User>(storageService, (db) => db.users));

/**
 * Optionally expose a helper to create an AppDependencies bundle from the manager.
 * @returns app dependencies instances.
 */
export function createDependenciesContainer(): AppDependencies {
    return {
        storage: manager.resolve<IStorageService>('storage'),
        sse: manager.resolve<ISseService>('sse'),
        logger: manager.resolve<ILogger>('logger'),
        todoItemsRepo: manager.resolve<StorageRepository<TodoItem>>('todoItemsRepo'),
        todoListsRepo: manager.resolve<StorageRepository<TodoList>>('todoListsRepo'),
        usersRepo: manager.resolve<StorageRepository<User>>('usersRepo'),
    };
}

/**
 * Router factory type.
 */
export type RouterFactory = (deps: AppDependencies) => Router;

/**
 * Default container for application use.
 */
export const container: AppDependencies = createDependenciesContainer();

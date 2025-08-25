import { IDIContainerManager } from "./abstractions/di-container-manager-abstraction";

/**
 * DI container manager implementation.
 */
export class DIContainerManager implements IDIContainerManager {
    private readonly services = new Map<string, () => unknown>();

    public register<T>(key: string, factory: () => T): void {
        this.services.set(key, factory as () => unknown);
    }

    public resolve<T>(key: string): T {
        const factory = this.services.get(key);
        if (!factory) {
            throw new Error(`Service '${key}' not found`);
        }
        return factory() as T;
    }
}

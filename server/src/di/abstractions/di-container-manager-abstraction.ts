/**
 * Dependency Injection Container Manager interface.
 */
export interface IDIContainerManager {
    /**
     * Register a dependency.
     * @param key Dependency key.
     * @param factory Dependency factory function.
     */
    register<T>(key: string, factory: () => T): void;
    
    /**
     * Resolve a dependency.
     * @param key Dependency key.
     */
    resolve<T>(key: string): T;
}
/**
 * Generic repository interface.
 * @template T entity type that's being managed.
 */
export interface IRepository<T> {
    /**
     * Get all entities.
     * @returns Array of entities.
     */
    getAll(): T[];

    /**
     * Get entity by ID
     * @param id id of the entity.
     */
    getById(id: string): T | undefined;

    /**
     * Add a new entity.
     * @param entity The entity to add.
     */
    add(entity: T): void;

    /**
     * Update an existing entity.
     * @param updater A function to update the entity.
     * @param predicate A function to find the entity to update.
     */
    update(updater: (entity: T) => void, predicate?: (e: T) => boolean): void;

    /**
     * Remove an entity by ID.
     * @param id The ID of the entity to remove.
     * @returns True if the entity was removed, false otherwise.
     */
    removeById(id: string): boolean;
}

import type { Response } from 'express';

export interface ISseService {
    subscribe(listId: string, res: Response): void;
    broadcast<T extends object | string | number | boolean | null>(listId: string, event: string, payload?: T | T[]): void;
}

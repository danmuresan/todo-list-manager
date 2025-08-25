import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { resetDB } from './helpers/storage-utils';

describe('Auth', () => {
    beforeEach(() => resetDB());

    test('register and authorize', async () => {
        const username = 'alice';
        const reg = await request(app).post('/auth/register').send({ username });
        expect(reg.status).toBe(200);
        expect(reg.body.token).toBeTruthy();

        const auth = await request(app).post('/auth/authorize').send({ username });
        expect(auth.status).toBe(200);
        expect(auth.body.token).toBeTruthy();
    });
});

describe('Lists and Todos', () => {
    beforeEach(() => resetDB());

    test('create list, create todo, transition', async () => {
        const username = 'bob';
        const { body: user } = await request(app).post('/auth/register').send({ username });
        const token: string = user.token;

        const listRes = await request(app)
            .post('/lists')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Team' });
        expect(listRes.status).toBe(201);
        const listId: string = listRes.body.id;

        const todoRes = await request(app)
            .post(`/todos/${listId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Task 1' });
        expect(todoRes.status).toBe(201);
        const todoId: string = todoRes.body.id;
        expect(todoRes.body.state).toBe('TODO');

        const fwd = await request(app)
            .post(`/todos/${listId}/${todoId}/transition`)
            .set('Authorization', `Bearer ${token}`)
            .send({ direction: 'forward' });
        expect(fwd.status).toBe(200);
        expect(fwd.body.state).toBe('ONGOING');

        const back = await request(app)
            .post(`/todos/${listId}/${todoId}/transition`)
            .set('Authorization', `Bearer ${token}`)
            .send({ direction: 'back' });
        expect(back.status).toBe(200);
        expect(back.body.state).toBe('TODO');
    });

    test('delete todo', async () => {
        const username = 'charlie';
        const { body: user } = await request(app).post('/auth/register').send({ username });
        const token: string = user.token;

        const listRes = await request(app)
            .post('/lists')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Work' });
        expect(listRes.status).toBe(201);
        const listId: string = listRes.body.id;

        const todoRes = await request(app)
            .post(`/todos/${listId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Deletable Task' });
        expect(todoRes.status).toBe(201);
        const todoId: string = todoRes.body.id;

        const delRes = await request(app)
            .delete(`/todos/${listId}/${todoId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(delRes.status).toBe(204);

        const listTodos = await request(app)
            .get(`/todos/${listId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(listTodos.status).toBe(200);
        expect(listTodos.body.find((t: { id: string }) => t.id === todoId)).toBeUndefined();
    });
});

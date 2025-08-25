import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { resetDB } from './helpers/storage-utils';

describe('Auth tests', () => {
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

describe('Lists and Todos tests', () => {
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
            .send({ transitionItem: 'next' });
        expect(fwd.status).toBe(200);
        expect(fwd.body.state).toBe('ONGOING');

        const back = await request(app)
            .post(`/todos/${listId}/${todoId}/transition`)
            .set('Authorization', `Bearer ${token}`)
            .send({ transitionItem: 'previous' });
        expect(back.status).toBe(200);
        expect(back.body.state).toBe('TODO');
    });





});

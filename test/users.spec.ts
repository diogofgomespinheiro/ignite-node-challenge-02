import request from 'supertest';
import { expect, it, beforeAll, afterAll, describe, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';

import { app } from '../src/app';
import { knex } from '../src/database';
import { type User } from '../src/interfaces';

describe('users routes', () => {
  const user: User = {
    id: faker.string.uuid(),
    session_id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName()
  };

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await knex('users').where({ id: user.id }).delete();
  });

  it('should be able to create a new user', async () => {
    const response = await request(app.server).post('/users').send(user);
    expect(response.statusCode).toBe(201);
  });

  it('should be able identify if user already exists', async () => {
    await request(app.server).post('/users').send(user);
    const response = await request(app.server).post('/users').send(user);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'User already exists' });
  });

  it('should set cookie when user is created', async () => {
    const response = await request(app.server).post('/users').send(user);
    const cookies = response.get('Set-Cookie');
    expect(cookies).not.toBeUndefined();
    expect(cookies?.at(0)).contain('sessionId');
  });

  it('should set cookie when user already exists', async () => {
    await request(app.server).post('/users').send(user);
    const response = await request(app.server).post('/users').send(user);
    const cookies = response.get('Set-Cookie');
    expect(cookies).not.toBeUndefined();
    expect(cookies?.at(0)).contain('sessionId');
  });
});

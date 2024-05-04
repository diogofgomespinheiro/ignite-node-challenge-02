import request from 'supertest';
import { expect, it, beforeAll, afterAll, describe, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';

import { app } from '../src/app';
import { knex } from '../src/database';
import { type Meal } from '../src/interfaces';

const USER_ID = faker.string.uuid();

describe('meals routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await knex('meals').delete();
    await knex('users').where({ id: USER_ID }).delete();
  });

  describe('create meal enpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).post('/meals').send({
        name: faker.word.words(),
        description: faker.word.words(),
        isAccordingToDiet: faker.datatype.boolean()
      });
      expect(response.statusCode).toBe(401);
    });

    it('should return 400 if data is not correct', async () => {
      const { cookies } = await createUser();

      const response = await request(app.server)
        .post('/meals')
        .set('Cookie', cookies)
        .send({
          description: faker.word.words(),
          isAccordingToDiet: faker.datatype.boolean()
        });
      expect(response.statusCode).toBe(400);
    });

    it('should create a new meal', async () => {
      const { cookies } = await createUser();

      const response = await request(app.server)
        .post('/meals')
        .set('Cookie', cookies)
        .send({
          name: faker.word.words(),
          description: faker.word.words(),
          isAccordingToDiet: faker.datatype.boolean()
        });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('get meals enpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).get('/meals');
      expect(response.statusCode).toBe(401);
    });

    it('should retrieve user meals', async () => {
      const { cookies } = await createUser();
      await createMeal(cookies);

      const response = await request(app.server)
        .get('/meals')
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(200);
      expect(response.body.meals.length).toBe(1);
    });
  });

  describe('get meal by id enpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).get(
        `/meals/${faker.string.uuid()}`
      );
      expect(response.statusCode).toBe(401);
    });

    it('should retrieve 404 if meal does not exist', async () => {
      const { cookies } = await createUser();

      const response = await request(app.server)
        .get(`/meals/${faker.string.uuid()}`)
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(404);
    });

    it('should retrieve user meal', async () => {
      const { cookies } = await createUser();
      const meal = await createMeal(cookies);

      const response = await request(app.server)
        .get(`/meals/${meal.id}`)
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(200);
      expect(response.body.meal).toEqual(meal);
    });
  });

  describe('update meal by id enpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).patch(
        `/meals/${faker.string.uuid()}`
      );
      expect(response.statusCode).toBe(401);
    });

    it('should retrieve 404 if meal does not exist', async () => {
      const { cookies } = await createUser();

      const response = await request(app.server)
        .patch(`/meals/${faker.string.uuid()}`)
        .set('Cookie', cookies)
        .send({
          name: faker.word.words(),
          description: faker.word.words(),
          isAccordingToDiet: faker.datatype.boolean()
        });
      expect(response.statusCode).toBe(404);
    });

    it('should retrieve 400 if data is not sent', async () => {
      const { cookies } = await createUser();
      const meal = await createMeal(cookies);

      const response = await request(app.server)
        .patch(`/meals/${meal.id}`)
        .set('Cookie', cookies)
        .send();
      expect(response.statusCode).toBe(400);
    });

    it('should update meal', async () => {
      const { cookies } = await createUser();
      const meal = await createMeal(cookies);

      const newMealName = faker.word.words();
      const response = await request(app.server)
        .patch(`/meals/${meal.id}`)
        .set('Cookie', cookies)
        .send({ name: newMealName });
      expect(response.statusCode).toBe(200);
      expect(response.body.meal).toEqual({ ...meal, name: newMealName });
    });
  });

  describe('delete meal by id enpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).delete(
        `/meals/${faker.string.uuid()}`
      );
      expect(response.statusCode).toBe(401);
    });

    it('should retrieve 404 if meal does not exist', async () => {
      const { cookies } = await createUser();

      const response = await request(app.server)
        .delete(`/meals/${faker.string.uuid()}`)
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(404);
    });

    it('should delete user meal', async () => {
      const { cookies } = await createUser();
      const meal = await createMeal(cookies);

      let response = await request(app.server)
        .delete(`/meals/${meal.id}`)
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(204);

      response = await request(app.server).get('/meals').set('Cookie', cookies);
      expect(response.body.meals.length).toBe(0);
    });
  });

  describe('get metrics endpoint', () => {
    it('should return 401 if user does not exist', async () => {
      const response = await request(app.server).delete(
        `/meals/${faker.string.uuid()}`
      );
      expect(response.statusCode).toBe(401);
    });

    it('should obtain user meals metrics', async () => {
      const { cookies } = await createUser();

      await createMeal(cookies, { is_according_to_diet: true });
      await createMeal(cookies, { is_according_to_diet: false });
      await createMeal(cookies, { is_according_to_diet: true });
      await createMeal(cookies, { is_according_to_diet: true });
      await createMeal(cookies, { is_according_to_diet: true });
      await createMeal(cookies, { is_according_to_diet: false });
      await createMeal(cookies, { is_according_to_diet: true });
      await createMeal(cookies, { is_according_to_diet: true });

      const response = await request(app.server)
        .get('/meals/metrics')
        .set('Cookie', cookies);
      expect(response.statusCode).toBe(200);
      expect(response.body.totalMeals).toBe(8);
      expect(response.body.totalMealsAccordingToDiet).toBe(6);
      expect(response.body.totalMealsNotAccordingToDiet).toBe(2);
      expect(response.body.mostMealsSequenceAccordingToDiet).toBe(3);
    });
  });
});

async function createUser(): Promise<{ cookies: string[] }> {
  const createUserResponse = await request(app.server).post('/users').send({
    id: USER_ID,
    session_id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName()
  });

  const cookies = createUserResponse.get('Set-Cookie');
  if (!cookies) {
    expect(cookies).not.toBeUndefined();
    return { cookies: [] };
  }

  return {
    cookies
  };
}

async function createMeal(
  cookies: string[],
  data?: Partial<Meal>
): Promise<Meal> {
  const {
    body: { meal }
  } = await request(app.server)
    .post('/meals')
    .set('Cookie', cookies)
    .send({
      name: data?.name ?? faker.word.words(),
      description: data?.description ?? faker.word.words(),
      isAccordingToDiet: data?.is_according_to_diet ?? faker.datatype.boolean()
    });

  return meal;
}

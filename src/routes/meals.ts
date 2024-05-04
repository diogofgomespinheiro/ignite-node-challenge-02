import { randomUUID } from 'node:crypto';
import { type FastifyInstance } from 'fastify';
import { z } from 'zod';

import { verifyIfSessionIdExists } from '../middlewares';
import { knex } from '../database';
import { type Meal, type Request } from '../interfaces';

export async function mealsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request) => {
      const { user } = request;
      const meals = await knex('meals').where('user_id', user?.id).select();

      return {
        meals
      };
    }
  );

  app.post(
    '/',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request, response) => {
      const { user } = request;
      const createMealSchema = z.object({
        name: z.string(),
        description: z.string(),
        isAccordingToDiet: z.boolean()
      });
      const { data, error } = createMealSchema.safeParse(request.body);
      if (error) {
        return response.status(400).send({ message: error.message });
      }

      const [meal] = await knex('meals')
        .insert({
          id: randomUUID(),
          user_id: user?.id,
          name: data?.name,
          description: data?.description,
          is_according_to_diet: data?.isAccordingToDiet,
          datetime: new Date().toJSON()
        })
        .returning('*');

      return {
        meal
      };
    }
  );

  app.get(
    '/:id',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request, response) => {
      const { user } = request;
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      });

      const { data, error } = getMealParamsSchema.safeParse(request.params);
      if (error) {
        return response.status(400).send({ message: error.message });
      }

      const meal = await knex('meals')
        .where({ user_id: user?.id, id: data.id })
        .first();
      if (!meal) {
        return response.status(404).send({ message: 'Meal not found.' });
      }

      return { meal };
    }
  );

  app.patch(
    '/:id',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request, response) => {
      const { user } = request;
      const updateMealParamsSchema = z.object({
        id: z.string()
      });

      const { data: updateMealParams, error: updateMealParamsError } =
        updateMealParamsSchema.safeParse(request.params);
      if (updateMealParamsError) {
        return response
          .status(400)
          .send({ message: updateMealParamsError.message });
      }

      const meal = await knex('meals')
        .where({ user_id: user?.id, id: updateMealParams.id })
        .first();
      if (!meal) {
        return response.status(404).send({ message: 'Meal not found.' });
      }

      const updateMealBodySchema = z
        .object({
          name: z.string(),
          description: z.string(),
          isAccordingToDiet: z.boolean()
        })
        .partial();
      const { data: updateMealBody, error: updateMealBodyError } =
        updateMealBodySchema.safeParse(request.body);
      if (updateMealBodyError) {
        return response
          .status(400)
          .send({ message: updateMealBodyError.message });
      }

      const newMealData = { ...meal, ...updateMealBody };
      await knex('meals')
        .where({ user_id: user?.id, id: updateMealParams.id })
        .update(newMealData);

      return { meal: newMealData };
    }
  );

  app.delete(
    '/:id',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request, response) => {
      const { user } = request;
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid()
      });

      const { data, error } = deleteMealParamsSchema.safeParse(request.params);
      if (error) {
        return response.status(400).send({ message: error.message });
      }

      const meal = await knex('meals')
        .where({ user_id: user?.id, id: data.id })
        .first();
      if (!meal) {
        return response.status(404).send({ message: 'Meal not found.' });
      }

      await knex('meals').where({ user_id: user?.id, id: data.id }).delete();
      return response.status(204).send();
    }
  );

  // TODO: User meal metrics
  app.get(
    '/metrics',
    { preHandler: [verifyIfSessionIdExists] },
    async (request: Request) => {
      const { user } = request;
      const meals = await knex('meals').where('user_id', user?.id).select();

      return {
        totalMeals: meals.length,
        totalMealsAccordingToDiet: getMealsAccordingToDietCount(meals),
        totalMealsNotAccordingToDiet: getMealsNotAccordingToDietCount(meals),
        mostMealsSequenceAccordingToDiet:
          getMostMealsSequenceAccordingToDietCount(meals)
      };
    }
  );
}

function getMealsAccordingToDietCount(meals: Meal[]): number {
  return meals.filter(meal => meal.is_according_to_diet).length;
}

function getMealsNotAccordingToDietCount(meals: Meal[]): number {
  return meals.filter(meal => !meal.is_according_to_diet).length;
}

function getMostMealsSequenceAccordingToDietCount(meals: Meal[]): number {
  let mealsCount = 0;
  let bestMealsCount = 0;

  meals.forEach(meal => {
    if (meal.is_according_to_diet) {
      mealsCount++;
      return;
    }

    if (mealsCount > bestMealsCount) {
      bestMealsCount = mealsCount;
    }

    mealsCount = 0;
  });

  return bestMealsCount;
}

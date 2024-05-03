import { randomUUID } from 'node:crypto';
import { type FastifyReply, type FastifyInstance } from 'fastify';
import { z } from 'zod';

import { knex } from '../database';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', async (request, response) => {
    const createUserSchema = z.object({
      email: z.string(),
      name: z.string()
    });
    const userData = createUserSchema.parse(request.body);
    const existingUser = await knex('users')
      .where({ email: userData.email })
      .first();
    if (existingUser) {
      setSessionCookie(response, existingUser.session_id);
      return response.status(200).send({ message: 'User already exists' });
    }

    const [user] = await knex('users')
      .insert({
        session_id: randomUUID(),
        email: userData.email,
        name: userData.name
      })
      .returning('*');
    setSessionCookie(response, user.session_id);

    return response.status(201).send();
  });
}

function setSessionCookie(response: FastifyReply, id: string): void {
  response.setCookie('sessionId', id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

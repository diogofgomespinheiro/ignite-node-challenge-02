import { type FastifyRequest } from 'fastify';

import { type User } from './users';

export interface Request extends FastifyRequest {
  user?: User;
}

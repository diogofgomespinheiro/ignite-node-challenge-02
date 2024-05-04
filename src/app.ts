import fastify from 'fastify';
import cookie from '@fastify/cookie';

import { mealsRoutes, userRoutes } from './routes';

export const app = fastify();
app.register(cookie);
app.register(userRoutes, { prefix: '/users' });
app.register(mealsRoutes, { prefix: '/meals' });

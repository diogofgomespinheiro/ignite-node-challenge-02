import { env } from './env';
import { app } from './app';

app
  .listen({ port: env.PORT })
  .then(() => {
    console.log(`listening on port ${env.PORT}`);
  })
  .catch(error => {
    console.error(error);
  });

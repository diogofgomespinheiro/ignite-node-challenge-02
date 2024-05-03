// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      session_id: string;
      name: string;
      email: string;
    };

    meals: {
      id: string;
      user_id: string;
      name: string;
      description: string;
      is_according_to_diet: boolean;
      datetime: string;
    };
  }
}

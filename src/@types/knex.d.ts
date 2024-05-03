// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex';
import { type Meal, type User } from '../interfaces';

declare module 'knex/types/tables' {
  export interface Tables {
    users: User;
    meals: Meal;
  }
}

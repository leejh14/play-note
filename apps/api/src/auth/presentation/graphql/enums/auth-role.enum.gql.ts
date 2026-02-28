import { registerEnumType } from '@nestjs/graphql';

export enum AuthRole {
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

registerEnumType(AuthRole, {
  name: 'AuthRole',
  description: 'Authenticated role for current session token',
});

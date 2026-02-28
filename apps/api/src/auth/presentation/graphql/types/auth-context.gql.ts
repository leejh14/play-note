import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuthRole } from '@auth/presentation/graphql/enums/auth-role.enum.gql';

@ObjectType('AuthContext')
export class AuthContextGql {
  @Field(() => ID, { nullable: false })
  sessionId!: string;

  @Field(() => AuthRole, { nullable: false })
  role!: AuthRole;
}

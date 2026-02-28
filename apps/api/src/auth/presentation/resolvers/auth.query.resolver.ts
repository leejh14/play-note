import { Query, Resolver } from '@nestjs/graphql';
import { toGlobalId } from '@libs/relay';
import { CurrentAuth } from '@auth/decorators/current-auth.decorator';
import { AuthContext } from '@auth/types/auth-context.type';
import { AuthRole } from '@auth/presentation/graphql/enums/auth-role.enum.gql';
import { AuthContextGql } from '@auth/presentation/graphql/types/auth-context.gql';

@Resolver()
export class AuthQueryResolver {
  @Query(() => AuthContextGql, { nullable: false })
  authContext(@CurrentAuth() auth: AuthContext): AuthContextGql {
    return {
      sessionId: toGlobalId('Session', auth.sessionId),
      role: auth.role === 'admin' ? AuthRole.ADMIN : AuthRole.EDITOR,
    };
  }
}

import { Module } from '@nestjs/common';
import { NodeResolver } from '@shared/presentation/graphql/relay/node.resolver';
import { JSONScalar } from '@shared/presentation/graphql/scalars/json.scalar';

@Module({
  providers: [NodeResolver, JSONScalar],
  exports: [NodeResolver, JSONScalar],
})
export class SharedPresentationModule {}

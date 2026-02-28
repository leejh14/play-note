import { Module } from '@nestjs/common';
import { NodeResolver } from '@shared/presentation/graphql/relay/node.resolver';

@Module({
  providers: [NodeResolver],
  exports: [NodeResolver],
})
export class SharedPresentationModule {}

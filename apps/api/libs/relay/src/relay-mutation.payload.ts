import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class RelayMutationPayload {
  @Field(() => String, { nullable: true })
  clientMutationId?: string;
}

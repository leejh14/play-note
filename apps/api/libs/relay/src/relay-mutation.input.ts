import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType({ isAbstract: true })
export abstract class RelayMutationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  clientMutationId?: string;
}

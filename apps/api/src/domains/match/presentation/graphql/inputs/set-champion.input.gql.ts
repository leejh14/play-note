import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('SetChampionInput')
export class SetChampionInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  matchId!: string;

  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  champion?: string;
}

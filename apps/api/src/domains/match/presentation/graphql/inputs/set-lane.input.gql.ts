import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { Lane } from '@shared/domain/enums/lane.enum';

@InputType('SetLaneInput')
export class SetLaneInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  matchId!: string;

  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => Lane, { nullable: false })
  @IsEnum(Lane)
  lane!: Lane;
}

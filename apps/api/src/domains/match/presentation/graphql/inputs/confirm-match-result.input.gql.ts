import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { Side } from '@domains/match/domain/enums/side.enum';

@InputType('ConfirmMatchResultInput')
export class ConfirmMatchResultInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  matchId!: string;

  @Field(() => Side, { nullable: false })
  @IsEnum(Side)
  winnerSide!: Side;

  @Field(() => Side, { nullable: false })
  @IsEnum(Side)
  teamASide!: Side;
}

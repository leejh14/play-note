import { ObjectType, Field, ID } from '@nestjs/graphql';
import { RelayMutationPayload } from '@libs/relay';
import { Match } from './match.gql';

@ObjectType('CreateMatchFromPresetPayload')
export class CreateMatchFromPresetPayload extends RelayMutationPayload {
  matchId!: string;

  @Field(() => Match, { nullable: true })
  match?: Match;
}

@ObjectType('SetLanePayload')
export class SetLanePayload extends RelayMutationPayload {
  matchId!: string;

  @Field(() => Match, { nullable: true })
  match?: Match;
}

@ObjectType('SetChampionPayload')
export class SetChampionPayload extends RelayMutationPayload {
  matchId!: string;

  @Field(() => Match, { nullable: true })
  match?: Match;
}

@ObjectType('ConfirmMatchResultPayload')
export class ConfirmMatchResultPayload extends RelayMutationPayload {
  matchId!: string;

  @Field(() => Match, { nullable: true })
  match?: Match;
}

@ObjectType('DeleteMatchPayload')
export class DeleteMatchPayload extends RelayMutationPayload {
  @Field(() => ID, { nullable: false })
  deletedMatchId!: string;
}

import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';

@ObjectType('MatchTeamMember')
export class MatchTeamMember {
  @Field(() => ID, { nullable: false })
  id!: string;

  friendId!: string;

  @Field(() => Friend, { nullable: false })
  friend?: Friend;

  @Field(() => Team, { nullable: false })
  team!: Team;

  @Field(() => Lane, { nullable: false })
  lane!: Lane;

  @Field(() => String, { nullable: true })
  champion!: string | null;
}

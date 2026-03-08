import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Node } from '@shared/presentation/graphql/relay/node.resolver';
import { MatchStatus } from '@domains/match/domain/enums/match-status.enum';
import { Side } from '@domains/match/domain/enums/side.enum';
import { Team } from '@shared/domain/enums/team.enum';
import { Session } from '@domains/session/presentation/graphql/types/session.gql';
import { MatchTeamMember } from './match-team-member.gql';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';
import { ExtractionResult } from '@domains/attachment/presentation/graphql/types/extraction-result.gql';

@ObjectType('Match', {
  implements: () => [Node],
})
export class Match implements Node {
  @Field(() => ID, { nullable: false })
  id!: string;

  localId!: string;
  sessionId!: string;

  @Field(() => Session, { nullable: false })
  session?: Session;

  @Field(() => Int, { nullable: false })
  matchNo!: number;

  @Field(() => MatchStatus, { nullable: false })
  status!: MatchStatus;

  @Field(() => Side, { nullable: false })
  winnerSide!: Side;

  @Field(() => Team, { nullable: true })
  winnerTeam!: Team | null;

  @Field(() => Side, { nullable: false })
  teamASide!: Side;

  @Field(() => Boolean, { nullable: false })
  isConfirmed!: boolean;

  @Field(() => [MatchTeamMember], { nullable: false })
  teamMembers!: MatchTeamMember[];

  @Field(() => [Attachment], { nullable: false })
  attachments!: Attachment[];

  @Field(() => [ExtractionResult], { nullable: false })
  extractionResults!: ExtractionResult[];

  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;
}

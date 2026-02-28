import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Node } from '@shared/presentation/graphql/relay/node.resolver';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';
import { DateTimeScalar } from '@shared/presentation/graphql/scalars/date-time.scalar';
import { Attendance } from './attendance.gql';
import { TeamPresetMember } from './team-preset-member.gql';
import { Comment } from './comment.gql';
import { Match } from '@domains/match/presentation/graphql/types/match.gql';
import { Attachment } from '@domains/attachment/presentation/graphql/types/attachment.gql';

@ObjectType('Session', {
  implements: () => [Node],
})
export class Session implements Node {
  @Field(() => ID, { nullable: false })
  id!: string;

  localId!: string;

  @Field(() => ContentType, { nullable: false })
  contentType!: ContentType;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => DateTimeScalar, { nullable: false })
  startsAt!: Date;

  @Field(() => SessionStatus, { nullable: false })
  status!: SessionStatus;

  @Field(() => Boolean, { nullable: false })
  isAdminUnlocked!: boolean;

  @Field(() => Int, { nullable: false })
  attendingCount!: number;

  @Field(() => Int, { nullable: false })
  matchCount!: number;

  @Field(() => Boolean, { nullable: false })
  effectiveLocked!: boolean;

  @Field(() => [Attendance], { nullable: false })
  attendances!: Attendance[];

  @Field(() => [TeamPresetMember], { nullable: false })
  teamPresetMembers!: TeamPresetMember[];

  @Field(() => [Match], { nullable: false })
  matches!: Match[];

  @Field(() => [Attachment], { nullable: false })
  attachments!: Attachment[];

  @Field(() => [Comment], { nullable: false })
  comments!: Comment[];

  @Field(() => DateTimeScalar, { nullable: false })
  createdAt!: Date;

  @Field(() => DateTimeScalar, { nullable: false })
  updatedAt!: Date;
}

import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { toGlobalId } from '@libs/relay';
import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';
import { Attendance } from './attendance.gql';
import { TeamPresetMember } from './team-preset-member.gql';
import { Comment } from './comment.gql';
import { MatchStatus } from '@domains/match/domain/enums/match-status.enum';
import { Side } from '@domains/match/domain/enums/side.enum';
import { MatchTeamMember } from '@domains/match/presentation/graphql/types/match-team-member.gql';
import { ExtractionResult } from '@domains/attachment/presentation/graphql/types/extraction-result.gql';
import { AttachmentType } from '@domains/attachment/domain/enums/attachment-type.enum';

@ObjectType('PublicAttachment')
export class PublicAttachment {
  localId!: string;

  @Field(() => ID, { nullable: false })
  get id(): string {
    return toGlobalId('Attachment', this.localId);
  }

  @Field(() => AttachmentType, { nullable: false })
  type!: AttachmentType;

  @Field(() => String, { nullable: true })
  originalFileName!: string | null;
}

@ObjectType('PublicMatch')
export class PublicMatch {
  localId!: string;

  @Field(() => ID, { nullable: false })
  get id(): string {
    return toGlobalId('Match', this.localId);
  }

  @Field(() => Int, { nullable: false })
  matchNo!: number;

  @Field(() => MatchStatus, { nullable: false })
  status!: MatchStatus;

  @Field(() => Side, { nullable: false })
  winnerSide!: Side;

  @Field(() => Side, { nullable: false })
  teamASide!: Side;

  @Field(() => Boolean, { nullable: false })
  isConfirmed!: boolean;

  @Field(() => [MatchTeamMember], { nullable: false })
  teamMembers!: MatchTeamMember[];

  @Field(() => [PublicAttachment], { nullable: false })
  attachments!: PublicAttachment[];

  @Field(() => [ExtractionResult], { nullable: false })
  extractionResults!: ExtractionResult[];

  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;
}

@ObjectType('PublicSession')
export class PublicSession {
  localId!: string;

  @Field(() => ID, { nullable: false })
  get id(): string {
    return toGlobalId('Session', this.localId);
  }

  @Field(() => ContentType, { nullable: false })
  contentType!: ContentType;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: false })
  startsAt!: Date;

  @Field(() => SessionStatus, { nullable: false })
  status!: SessionStatus;

  @Field(() => Boolean, { nullable: false })
  isStructureLocked!: boolean;

  @Field(() => Boolean, { nullable: false })
  effectiveLocked!: boolean;

  @Field(() => Int, { nullable: false })
  attendingCount!: number;

  @Field(() => Int, { nullable: false })
  matchCount!: number;

  @Field(() => [Attendance], { nullable: false })
  attendances!: Attendance[];

  @Field(() => [TeamPresetMember], { nullable: false })
  teamPresetMembers!: TeamPresetMember[];

  @Field(() => [PublicMatch], { nullable: false })
  matches!: PublicMatch[];

  @Field(() => [PublicAttachment], { nullable: false })
  attachments!: PublicAttachment[];

  @Field(() => [Comment], { nullable: false })
  comments!: Comment[];

  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;
}

import { Field, GraphQLISODateTime, ID, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';

@InputType('SetAttendanceInput')
export class SetAttendanceInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => AttendanceStatus, { nullable: false })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @Field(() => GraphQLISODateTime, { nullable: false })
  @IsDate()
  expectedUpdatedAt!: Date;
}

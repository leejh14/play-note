import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AttendanceStatus } from '@domains/session/domain/enums/attendance-status.enum';
import { Friend } from '@domains/friend/presentation/graphql/types/friend.gql';

@ObjectType('Attendance')
export class Attendance {
  @Field(() => ID, { nullable: false })
  id!: string;

  friendId!: string;

  @Field(() => Friend, { nullable: false })
  friend?: Friend;

  @Field(() => AttendanceStatus, { nullable: false })
  status!: AttendanceStatus;
}

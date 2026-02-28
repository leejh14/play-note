import { toGlobalId } from '@libs/relay';
import { AttendanceOutputDto } from '@domains/session/application/dto/outputs/attendance.output.dto';
import { Attendance } from '@domains/session/presentation/graphql/types/attendance.gql';

export class AttendanceGqlMapper {
  static toGql(dto: AttendanceOutputDto): Attendance {
    const gql = new Attendance();
    gql.id = toGlobalId('Attendance', dto.id);
    gql.friendId = dto.friendId;
    gql.status = dto.status;
    return gql;
  }
}

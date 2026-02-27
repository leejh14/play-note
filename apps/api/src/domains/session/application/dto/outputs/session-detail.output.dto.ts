import { ContentType } from '@domains/session/domain/enums/content-type.enum';
import { SessionStatus } from '@domains/session/domain/enums/session-status.enum';
import { AttendanceOutputDto } from './attendance.output.dto';
import { TeamPresetMemberOutputDto } from './team-preset-member.output.dto';

export class SessionDetailOutputDto {
  readonly id: string;
  readonly contentType: ContentType;
  readonly title: string | null;
  readonly startsAt: Date;
  readonly status: SessionStatus;
  readonly isAdminUnlocked: boolean;
  readonly editorToken: string;
  readonly adminToken: string;
  readonly attendances: AttendanceOutputDto[];
  readonly teamPresetMembers: TeamPresetMemberOutputDto[];
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    contentType: ContentType;
    title: string | null;
    startsAt: Date;
    status: SessionStatus;
    isAdminUnlocked: boolean;
    editorToken: string;
    adminToken: string;
    attendances: AttendanceOutputDto[];
    teamPresetMembers: TeamPresetMemberOutputDto[];
    createdAt: Date;
  }) {
    this.id = props.id;
    this.contentType = props.contentType;
    this.title = props.title;
    this.startsAt = props.startsAt;
    this.status = props.status;
    this.isAdminUnlocked = props.isAdminUnlocked;
    this.editorToken = props.editorToken;
    this.adminToken = props.adminToken;
    this.attendances = props.attendances;
    this.teamPresetMembers = props.teamPresetMembers;
    this.createdAt = props.createdAt;
  }
}

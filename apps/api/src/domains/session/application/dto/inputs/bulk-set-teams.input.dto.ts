import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

export class BulkSetTeamsInputDto {
  readonly sessionId: string;
  readonly expectedUpdatedAt: Date;
  readonly assignments: {
    readonly friendId: string;
    readonly team: Team;
    readonly lane?: Lane;
  }[];

  constructor(props: {
    sessionId: string;
    expectedUpdatedAt: Date;
    assignments: { friendId: string; team: Team; lane?: Lane }[];
  }) {
    this.sessionId = props.sessionId;
    this.expectedUpdatedAt = props.expectedUpdatedAt;
    this.assignments = props.assignments;
  }
}

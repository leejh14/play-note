import { registerEnumType } from '@nestjs/graphql';
import { Team } from '@shared/domain/enums/team.enum';

registerEnumType(Team, {
  name: 'Team',
  description: '팀 구분',
});

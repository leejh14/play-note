import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

@InputType('SetTeamMemberInput')
export class SetTeamMemberInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => Team, { nullable: true })
  @IsOptional()
  @IsEnum(Team)
  team?: Team | null;

  @Field(() => Lane, { nullable: true })
  @IsOptional()
  @IsEnum(Lane)
  lane?: Lane;
}

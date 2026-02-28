import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RelayMutationInput } from '@libs/relay';
import { Team } from '@shared/domain/enums/team.enum';
import { Lane } from '@shared/domain/enums/lane.enum';

@InputType('TeamAssignmentInput')
export class TeamAssignmentInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => Team, { nullable: false })
  @IsEnum(Team)
  team!: Team;

  @Field(() => Lane, { nullable: true })
  @IsOptional()
  @IsEnum(Lane)
  lane?: Lane;
}

@InputType('BulkSetTeamsInput')
export class BulkSetTeamsInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  sessionId!: string;

  @Field(() => [TeamAssignmentInput], { nullable: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentInput)
  assignments!: TeamAssignmentInput[];
}

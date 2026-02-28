import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('CreateFriendInput')
export class CreateFriendInput extends RelayMutationInput {
  @Field(() => String, { nullable: false })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  riotGameName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  riotTagLine?: string;
}

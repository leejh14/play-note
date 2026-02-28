import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { RelayMutationInput } from '@libs/relay';

@InputType('UpdateFriendInput')
export class UpdateFriendInput extends RelayMutationInput {
  @Field(() => ID, { nullable: false })
  @IsString()
  friendId!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName?: string;

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

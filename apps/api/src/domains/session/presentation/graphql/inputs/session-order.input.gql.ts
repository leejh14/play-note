import { Field, InputType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { SessionOrderField } from '@domains/session/presentation/graphql/enums/session-order-field.enum.gql';
import { OrderDirection } from '@shared/presentation/graphql/enums/order-direction.enum.gql';

@InputType('SessionOrder')
export class SessionOrderInput {
  @Field(() => SessionOrderField, { nullable: false })
  @IsEnum(SessionOrderField)
  field!: SessionOrderField;

  @Field(() => OrderDirection, { nullable: false })
  @IsEnum(OrderDirection)
  direction!: OrderDirection;
}

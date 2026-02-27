import { BaseEntity, BaseEntityProps } from './base-entity';

export abstract class AggregateRoot extends BaseEntity {
  protected constructor(props: BaseEntityProps) {
    super(props);
  }
}

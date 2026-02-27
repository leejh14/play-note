import { uuidv7 } from 'uuidv7';

export interface BaseEntityProps {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export abstract class BaseEntity {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(props: BaseEntityProps) {
    this._id = props.id;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  protected static generateId(): string {
    return uuidv7();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  equals(other: BaseEntity): boolean {
    if (other === this) return true;
    return this._id === other._id;
  }
}

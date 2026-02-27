import { randomBytes } from 'crypto';
import { ValueObject } from '@shared/domain/value-object';

export interface SessionTokenValue {
  readonly value: string;
}

export class SessionToken extends ValueObject<SessionTokenValue> {
  private readonly _value: string;

  private constructor(value: string) {
    super();
    this._value = value;
  }

  static generate(): SessionToken {
    const value = randomBytes(32).toString('hex');
    return new SessionToken(value);
  }

  static reconstitute(value: string): SessionToken {
    return new SessionToken(value);
  }

  get value(): string {
    return this._value;
  }

  protected toValue(): SessionTokenValue {
    return { value: this._value };
  }
}

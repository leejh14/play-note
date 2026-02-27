import { ValueObject } from '@shared/domain/value-object';

export interface RiotIdValue {
  readonly gameName: string;
  readonly tagLine: string;
}

export class RiotId extends ValueObject<RiotIdValue> {
  private readonly _gameName: string;
  private readonly _tagLine: string;

  private constructor(gameName: string, tagLine: string) {
    super();
    this._gameName = gameName;
    this._tagLine = tagLine;
  }

  static create(gameName: string, tagLine: string): RiotId {
    const trimmedGameName = gameName.trim();
    const trimmedTagLine = tagLine.trim();

    if (trimmedGameName.length === 0) {
      throw new Error('RiotId gameName cannot be empty');
    }
    if (trimmedTagLine.length === 0) {
      throw new Error('RiotId tagLine cannot be empty');
    }

    return new RiotId(trimmedGameName, trimmedTagLine);
  }

  static reconstitute(gameName: string, tagLine: string): RiotId {
    return new RiotId(gameName, tagLine);
  }

  get gameName(): string {
    return this._gameName;
  }

  get tagLine(): string {
    return this._tagLine;
  }

  toFullString(): string {
    return `${this._gameName}#${this._tagLine}`;
  }

  toNormalized(): string {
    return this.toFullString().toLowerCase();
  }

  protected toValue(): RiotIdValue {
    return {
      gameName: this._gameName,
      tagLine: this._tagLine,
    };
  }
}

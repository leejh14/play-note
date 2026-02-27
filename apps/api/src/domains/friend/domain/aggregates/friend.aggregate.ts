import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { FriendAlreadyArchivedException } from '../exceptions/friend-already-archived.exception';
import { FriendNotArchivedException } from '../exceptions/friend-not-archived.exception';

export interface CreateFriendProps {
  readonly displayName: string;
  readonly riotGameName?: string | null;
  readonly riotTagLine?: string | null;
}

export interface FriendReconstituteProps extends BaseEntityProps {
  readonly displayName: string;
  readonly riotGameName: string | null;
  readonly riotTagLine: string | null;
  readonly isArchived: boolean;
}

export interface UpdateFriendProfileProps {
  readonly displayName?: string;
  readonly riotGameName?: string | null;
  readonly riotTagLine?: string | null;
}

export class Friend extends AggregateRoot {
  private _displayName: string;
  private _riotGameName: string | null;
  private _riotTagLine: string | null;
  private _isArchived: boolean;

  private constructor(props: FriendReconstituteProps) {
    super(props);
    this._displayName = props.displayName;
    this._riotGameName = props.riotGameName;
    this._riotTagLine = props.riotTagLine;
    this._isArchived = props.isArchived;
  }

  static create(props: CreateFriendProps): Friend {
    const now = new Date();
    const id = AggregateRoot.generateId();

    if (!props.displayName?.trim()) {
      throw new Error('displayName cannot be empty');
    }

    return new Friend({
      id,
      displayName: props.displayName.trim(),
      riotGameName: props.riotGameName?.trim() ?? null,
      riotTagLine: props.riotTagLine?.trim() ?? null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: FriendReconstituteProps): Friend {
    return new Friend(props);
  }

  get displayName(): string {
    return this._displayName;
  }

  get riotGameName(): string | null {
    return this._riotGameName;
  }

  get riotTagLine(): string | null {
    return this._riotTagLine;
  }

  get isArchived(): boolean {
    return this._isArchived;
  }

  updateProfile(props: UpdateFriendProfileProps): void {
    if (props.displayName !== undefined) {
      const trimmed = props.displayName.trim();
      if (trimmed.length === 0) {
        throw new Error('displayName cannot be empty');
      }
      this._displayName = trimmed;
    }
    if (props.riotGameName !== undefined) {
      this._riotGameName = props.riotGameName?.trim() ?? null;
    }
    if (props.riotTagLine !== undefined) {
      this._riotTagLine = props.riotTagLine?.trim() ?? null;
    }
    this.touch();
  }

  archive(): void {
    if (this._isArchived) {
      throw new FriendAlreadyArchivedException();
    }
    this._isArchived = true;
    this.touch();
  }

  restore(): void {
    if (!this._isArchived) {
      throw new FriendNotArchivedException();
    }
    this._isArchived = false;
    this.touch();
  }
}

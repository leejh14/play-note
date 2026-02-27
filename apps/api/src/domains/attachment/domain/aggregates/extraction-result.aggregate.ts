import { BaseEntityProps } from '@shared/domain/base-entity';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { ExtractionStatus } from '../enums/extraction-status.enum';

export interface CreateExtractionResultProps {
  readonly attachmentId: string;
  readonly matchId: string;
}

export interface ExtractionResultReconstituteProps extends BaseEntityProps {
  readonly attachmentId: string;
  readonly matchId: string;
  readonly status: ExtractionStatus;
  readonly model: string | null;
  readonly result: Record<string, unknown> | null;
}

export interface MarkDoneProps {
  readonly model: string;
  readonly result: Record<string, unknown>;
}

export class ExtractionResult extends AggregateRoot {
  private readonly _attachmentId: string;
  private readonly _matchId: string;
  private _status: ExtractionStatus;
  private _model: string | null;
  private _result: Record<string, unknown> | null;

  private constructor(props: ExtractionResultReconstituteProps) {
    super(props);
    this._attachmentId = props.attachmentId;
    this._matchId = props.matchId;
    this._status = props.status;
    this._model = props.model;
    this._result = props.result;
  }

  static create(props: CreateExtractionResultProps): ExtractionResult {
    const now = new Date();
    const id = AggregateRoot.generateId();

    return new ExtractionResult({
      id,
      attachmentId: props.attachmentId,
      matchId: props.matchId,
      status: ExtractionStatus.PENDING,
      model: null,
      result: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ExtractionResultReconstituteProps): ExtractionResult {
    return new ExtractionResult(props);
  }

  get attachmentId(): string {
    return this._attachmentId;
  }

  get matchId(): string {
    return this._matchId;
  }

  get status(): ExtractionStatus {
    return this._status;
  }

  get model(): string | null {
    return this._model;
  }

  get result(): Record<string, unknown> | null {
    return this._result;
  }

  markDone(props: MarkDoneProps): void {
    this._status = ExtractionStatus.DONE;
    this._model = props.model;
    this._result = props.result;
    this.touch();
  }

  markFailed(): void {
    this._status = ExtractionStatus.FAILED;
    this.touch();
  }
}

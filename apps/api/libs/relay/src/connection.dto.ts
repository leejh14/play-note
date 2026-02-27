export class PageInfoDto {
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly startCursor: string | null;
  readonly endCursor: string | null;

  constructor(props: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  }) {
    this.hasNextPage = props.hasNextPage;
    this.hasPreviousPage = props.hasPreviousPage;
    this.startCursor = props.startCursor;
    this.endCursor = props.endCursor;
  }
}

export class EdgeDto<T> {
  readonly node: T;
  readonly cursor: string;

  constructor(props: { node: T; cursor: string }) {
    this.node = props.node;
    this.cursor = props.cursor;
  }
}

export class ConnectionDto<T> {
  readonly edges: EdgeDto<T>[];
  readonly pageInfo: PageInfoDto;

  constructor(props: { edges: EdgeDto<T>[]; pageInfo: PageInfoDto }) {
    this.edges = props.edges;
    this.pageInfo = props.pageInfo;
  }
}

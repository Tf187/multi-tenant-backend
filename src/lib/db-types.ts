export type QueryResult<Row = Record<string, unknown>> = {
  rows: Row[];
  rowCount?: number | null;
};

export type Database = {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

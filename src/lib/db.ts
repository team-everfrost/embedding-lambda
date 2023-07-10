import ServerlessClient from 'serverless-postgres';

export const client = new ServerlessClient({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  debug: true,
  delayMs: 3000,
});

export const enum Status {
  EMBED_PENDING = 'EMBED_PENDING',
  EMBED_PROCESSING = 'EMBED_PROCESSING',
  EMBED_REJECTED = 'EMBED_REJECTED',
  COMPLETED = 'COMPLETED',
}

export const findDoc = async (docId: string) => {
  const queryResult = await client.query(
    'SELECT doc_id, title, type, url, content, status, user_id FROM document WHERE doc_id = $1',
    [docId],
  );
  return queryResult.rows[0];
};

export const changeDocStatus = async (docId: string, status: Status) => {
  await client.query('UPDATE document SET status = $1 WHERE doc_id = $2', [
    status,
    docId,
  ]);
};

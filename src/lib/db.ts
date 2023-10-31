import ServerlessClient from 'serverless-postgres';
import { Status } from '../types';

export const client = new ServerlessClient({
  connectionString: process.env.DB_URL,
  ssl: true,
  application_name: 'embedding-lambda',
  // debug: true,
  delayMs: 3000,
});

export const findDoc = async (documentId: number) => {
  const queryResult = await client.query(
    'SELECT id, doc_id, title, type, url, content, status, user_id FROM document WHERE id = $1',
    [documentId],
  );
  return queryResult.rows[0];
};

export const findUid = async (userId: number) => {
  const queryResult = await client.query(
    'SELECT uid FROM users WHERE id = $1',
    [userId],
  );
  return queryResult.rows[0];
};

export const changeDocStatus = async (documentId: number, status: Status) => {
  await client.query('UPDATE document SET status = $1 WHERE id = $2', [
    status,
    documentId,
  ]);
};

export const changeContent = async (documentId: number, content: string) => {
  await client.query('UPDATE document SET content = $1 WHERE id = $2', [
    content,
    documentId,
  ]);
};

export const changeSummary = async (documentId: number, summary: string) => {
  await client.query('UPDATE document SET summary = $1 WHERE id = $2', [
    summary,
    documentId,
  ]);
};

export const changeHashtags = async (
  documentId: number,
  userId: string,
  hashtags: string[],
) => {
  try {
    // 트랜잭션 시작
    await client.query('BEGIN');

    // 기존 해시태그 연결 삭제
    await client.query('DELETE FROM "_DocumentToTag" WHERE "A" = $1', [
      documentId,
    ]);

    // 해시태그 upsert
    const upsertQuery = `
    INSERT INTO Tag (name, user_id, updated_at)
    VALUES (unnest($1::text[]), $2, NOW())
    ON CONFLICT (name, user_id)
    DO UPDATE SET updated_at = NOW();
  `;
    await client.query(upsertQuery, [hashtags, userId]);

    // 해시태그 연결
    const connectQuery = `
    INSERT INTO "_DocumentToTag" ("A", "B")
    SELECT $1, id
    FROM Tag
    WHERE name = ANY($2::text[]) AND user_id = $3;
  `;
    await client.query(connectQuery, [documentId, hashtags, userId]);

    // 해당 유저의 0개짜리 해시태그 삭제
    await client.query(
      `
    DELETE FROM Tag
    WHERE user_id = $1 AND id NOT IN (
      SELECT "B"
      FROM "_DocumentToTag"
    );
  `,
      [userId],
    );

    // 트랜잭션 종료
    await client.query('COMMIT');
  } catch (e) {
    // 트랜잭션 롤백
    await client.query('ROLLBACK');
    throw e;
  }
};

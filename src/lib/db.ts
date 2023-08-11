import ServerlessClient from 'serverless-postgres';
import { EmbeddedText, Status } from '../types';

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

export const changeThumbnailUrl = async (documentId: number, url: string) => {
  await client.query('UPDATE document SET thumbnail_url = $1 WHERE id = $2', [
    url,
    documentId,
  ]);
};

export const insertEmbeds = async (embeddedTexts: EmbeddedText[]) => {
  const values: any[] = [];
  const placeholders: string[] = [];

  embeddedTexts.forEach((text, index) => {
    const valueIndex = index * 10 + 1; // PostgreSQL placeholders start from $1
    placeholders.push(
      `(
        $${valueIndex},
        $${valueIndex + 1},
        $${valueIndex + 2},
        $${valueIndex + 3},
        $${valueIndex + 4},
        $${valueIndex + 5},
        $${valueIndex + 6},
        $${valueIndex + 7},
        $${valueIndex + 8},
        $${valueIndex + 9}
      )`,
    );

    values.push(
      text.documentId,
      text.userId,
      text.type,
      text.chapter,
      text.startPageNumber,
      text.startLineNumber,
      text.endPageNumber,
      text.endLineNumber,
      text.content,
      JSON.stringify(text.vector),
    );
  });

  const text = `
    INSERT INTO embedded_text(
      document_id,
      user_id,
      type,
      chapter,
      start_page_number,
      start_line_number,
      end_page_number,
      end_line_number,
      content,
      vector
    ) VALUES ${placeholders.join(', ')}
  `;

  await client.query(text, values);
};

export const deleteEmbeds = async (documentId: number) => {
  await client.query('DELETE FROM embedded_text WHERE document_id = $1', [
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
};

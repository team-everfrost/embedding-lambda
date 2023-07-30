import ServerlessClient from 'serverless-postgres';
import { EmbeddedText } from '../embed/embed';

export const client = new ServerlessClient({
  connectionString: process.env.DB_URL,
  ssl: true,
  application_name: 'embedding-lambda',
  // debug: true,
  delayMs: 3000,
});

export const enum Status {
  EMBED_PENDING = 'EMBED_PENDING',
  EMBED_PROCESSING = 'EMBED_PROCESSING',
  EMBED_REJECTED = 'EMBED_REJECTED',
  COMPLETED = 'COMPLETED',
}

export const findDoc = async (documentId: number) => {
  const queryResult = await client.query(
    'SELECT title, type, url, content, status, user_id FROM document WHERE id = $1',
    [documentId],
  );
  return queryResult.rows[0];
};

export const changeDocStatus = async (documentId: number, status: Status) => {
  await client.query('UPDATE document SET status = $1 WHERE id = $2', [
    status,
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

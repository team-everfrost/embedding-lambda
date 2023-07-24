import ServerlessClient from 'serverless-postgres';
import { EmbeddedText } from '../embed/embed';

export const client = new ServerlessClient({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: true,
  application_name: 'embedding-lambda',
  debug: true,
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
    //TODO: valueIndex9 추가해야함
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
        $${valueIndex + 8}
        
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
      // text.content,
      JSON.stringify(text.vector),
    );
  });

  //TODO: 빈자리에 content 추가하면 됨
  const text = `
    INSERT INTO embedded_text(
      document_id,
      uid,
      type,
      chapter,
      start_page_number,
      start_line_number,
      end_page_number,
      end_line_number,
      
      vector
    ) VALUES ${placeholders.join(', ')}
  `;

  await client.query(text, values);
};

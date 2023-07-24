import { getEmbedding } from '../lib/openai';

export enum DocType {
  MEMO = 'MEMO',
  WEBPAGE = 'WEBPAGE',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

export interface EmbeddedText {
  documentId: string;
  userId: string;
  type: DocType;
  chapter: string; // 챕터명, 소제목, ...
  startPageNumber: number; // Memo와 웹페이지는 1로 고정
  startLineNumber: number;
  endPageNumber: number;
  endLineNumber: number;
  content: string;
  vector: number[];
}

export interface ParsedContent {
  chapter: string;
  page: number;
  content: string;
}

const chunkSize = 1024;
const chunkOverlap = 100;

export const createEmbeds = async (
  docId: string,
  userId: string,
  type: DocType,
  parsedContent: ParsedContent[],
): Promise<EmbeddedText[]> => {
  const embeddedTexts: EmbeddedText[] = [];

  for (const { chapter, page, content } of parsedContent) {
    const numOfChunks = Math.ceil(content.length / (chunkSize - chunkOverlap));

    let lineNumber = 1;
    for (let index = 0; index < numOfChunks; index++) {
      const start = index * (chunkSize - chunkOverlap);
      const end = start + chunkSize;
      const chunk = content.slice(start, end);
      const vector = await getEmbedding(chunk);

      // Calculate line numbers
      const startLineNumber = lineNumber;
      const endLineNumber = lineNumber + chunk.split('\n').length - 1;

      // Update line number for the next chunk
      lineNumber = endLineNumber + 1;

      embeddedTexts.push({
        documentId: docId,
        userId,
        type,
        chapter,
        startPageNumber: page,
        endPageNumber: page,
        startLineNumber,
        endLineNumber,
        content: chunk,
        vector,
      });
    }
  }

  return embeddedTexts;
};

import { getEmbedding } from '../lib/openai';
import { DocType, EmbeddedText, ParsedContent } from '../types';

const chunkSize = 1024;
const chunkOverlap = 100;
const maxNumOfChunks = 100;

export const createEmbeds = async (
  docId: number,
  userId: string,
  type: DocType,
  parsedContents: ParsedContent[],
): Promise<EmbeddedText[]> => {
  const embeddedTexts: EmbeddedText[] = [];

  for (const { chapter, page, content } of parsedContents) {
    const numOfChunks = Math.ceil(content.length / (chunkSize - chunkOverlap));

    let lineNumber = 1;
    for (
      let index = 0;
      index < Math.min(numOfChunks, maxNumOfChunks);
      index++
    ) {
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

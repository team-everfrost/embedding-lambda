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

    for (
      let index = 0;
      index < Math.min(numOfChunks, maxNumOfChunks);
      index++
    ) {
      const start = index * (chunkSize - chunkOverlap);
      const end = start + chunkSize;
      const chunk = content.slice(start, end);
      const vector = await getEmbedding(chunk);

      embeddedTexts.push({
        documentId: docId,
        userId,
        type,
        chapter,
        page,
        index,
        content: chunk,
        vector,
      });
    }
  }

  return embeddedTexts;
};

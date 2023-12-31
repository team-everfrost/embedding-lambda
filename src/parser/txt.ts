import { readFile } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

export const parseTxt = async (doc: Doc) => {
  const byteArray = await readFile(doc.doc_id);

  const content = Buffer.from(byteArray).toString();
  const parsedContent: ParsedContent[] = [];
  parsedContent.push({
    chapter: doc.title.substring(0, doc.title.lastIndexOf('.')),
    page: 1,
    content,
  });
  return { parsedContent, content };
};

import { getOcrResult } from '../lib/ocr';
import { getFileSignedUrl } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

export const parseImage = async (doc: Doc) => {
  const fileUrl = await getFileSignedUrl(doc.doc_id);

  const content = await getOcrResult(fileUrl);
  const parsedContent: ParsedContent[] = [];
  parsedContent.push({
    chapter: doc.title.substring(0, doc.title.lastIndexOf('.')),
    page: 1,
    content,
  });
  return { parsedContent, content };
};

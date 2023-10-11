import { getOcrResult } from '../lib/ocr';
import { getFileSignedUrl } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

export const parseImage = async (doc: Doc) => {
  const fileUrl = await getFileSignedUrl(doc.doc_id);

  const { caption, text } = await getOcrResult(fileUrl);

  console.log('caption: ' + caption.substring(0, 50));
  console.log('text: ' + text.substring(0, 50));

  const content = text || caption;

  const parsedContent: ParsedContent[] = [];
  parsedContent.push({
    chapter: doc.title.substring(0, doc.title.lastIndexOf('.')),
    page: 1,
    content,
  });
  return { parsedContent, content };
};

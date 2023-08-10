import { Doc, ParsedContent } from '../types';

export const parseMemo = async (doc: Doc) => {
  const content = doc.content;
  const parsedContent: ParsedContent[] = [];
  parsedContent.push({
    chapter: doc.title,
    page: 1,
    content,
  });
  return { parsedContent, content };
};

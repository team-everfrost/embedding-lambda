import { Doc, ParsedContent } from '../types';

export const parseWebpage = async (doc: Doc) => {
  // HTML 태그 제거
  const content = doc.content.replace(/<[^>]*>?/gm, '');

  const parsedContent: ParsedContent[] = [];
  parsedContent.push({
    chapter: doc.title,
    page: 1,
    content,
  });
  return { parsedContent, content };
};

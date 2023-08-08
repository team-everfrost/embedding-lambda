import { DocType, ParsedContent } from './embed';

export interface Doc {
  document_id: string;
  title: string;
  type: DocType;
  url: string;
  content: string;
  status: string;
  user_id: string;
}

export const clean = (doc: Doc) => {
  const result = doc;
  if (doc.type === DocType.WEBPAGE) {
    result.content = doc.content.replace(/<[^>]*>?/gm, '');
  }
  return result;
};

export const parse = async (doc: Doc): Promise<ParsedContent[]> => {
  // IMAGE, FILE S3에서 로드
  if (doc.type === DocType.IMAGE || doc.type === DocType.FILE) {
    //TODO: S3에서 로드 구현
    throw new Error('Not implemented');
  }

  if (doc.type === DocType.MEMO || doc.type === DocType.WEBPAGE) {
    const content = doc.content;
    const parsedContent: ParsedContent[] = [];
    parsedContent.push({
      chapter: doc.title,
      page: 1,
      content,
    });
    return parsedContent;
  }
};

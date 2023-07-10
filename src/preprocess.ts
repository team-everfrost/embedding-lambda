import { Document } from 'langchain/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';

export enum DocType {
  MEMO = 'MEMO',
  WEBPAGE = 'WEBPAGE',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

interface Doc {
  doc_id: string;
  title: string;
  type: DocType;
  url: string;
  content: string;
  status: string;
  user_id: string;
}

export const preprocess = async (doc: Doc) => {
  const splitter = new CharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 100,
  });

  let docs: Document[] = [];

  // IMAGE, FILE S3에서 로드
  if (doc.type === DocType.IMAGE || doc.type === DocType.FILE) {
    //TODO: S3에서 로드 구현
    throw new Error('Not implemented');
  }

  if (doc.type === DocType.MEMO || doc.type === DocType.WEBPAGE) {
    const metadata = { userId: doc.user_id, type: doc.type };
    docs = await splitter.createDocuments([doc.content], [metadata]);
  }

  return docs;
};

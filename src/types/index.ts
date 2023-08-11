export const enum Status {
  EMBED_PENDING = 'EMBED_PENDING',
  EMBED_PROCESSING = 'EMBED_PROCESSING',
  EMBED_REJECTED = 'EMBED_REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface Doc {
  id: number;
  doc_id: string;
  title: string;
  type: DocType;
  url: string;
  content: string;
  status: string;
  user_id: string;
  uid: string;
}

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

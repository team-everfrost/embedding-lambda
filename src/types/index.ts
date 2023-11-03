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
  chapter: string; // 챕터명, 소제목, ...

  page: number; // 페이지 번호
  index: number; // 해당 페이지의 몇 번째 chunk인지
  content: string;
  vector: number[];

  userId: string;
  documentId: number;
  type: DocType;
}

export interface DocumentIndex {
  title: string;
  content: string;
  summary: string;

  user_id: string;
  document_id: string;
  document_type: DocType;
}

export interface EmbeddingIndex {
  vector: number[];
  page: number;
  index: number;

  user_id: string;
  document_id: string;
  document_type: DocType;
}

export interface ParsedContent {
  chapter: string;
  page: number;
  content: string;
}

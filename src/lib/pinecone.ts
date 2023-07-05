import { PineconeClient } from '@pinecone-database/pinecone';
import { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

// Initialize vector db
let pineconeIndex: VectorOperationsApi;
let vectorStore: PineconeStore;
let openAIEmbeddings: OpenAIEmbeddings;

export const pineconeInit = async () => {
  openAIEmbeddings = new OpenAIEmbeddings();

  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX);

  vectorStore = await PineconeStore.fromExistingIndex(openAIEmbeddings, {
    pineconeIndex,
  });
};

export const insertDocs = async (docs: Document[]) => {
  await PineconeStore.fromDocuments(docs, openAIEmbeddings, { pineconeIndex });
};

export const searchDocs = async (
  query: string,
  k: number,
  metadata: object,
) => {
  return await vectorStore.similaritySearch(query, k, metadata);
};

export const searchDocsWithScore = async (
  query: string,
  k: number,
  metadata: object,
) => {
  return await vectorStore.similaritySearchWithScore(query, k, metadata);
};

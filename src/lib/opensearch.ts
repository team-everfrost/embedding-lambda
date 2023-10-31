import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { Doc, DocumentIndex, EmbeddedText, EmbeddingIndex } from '../types';

export const documentIndex = process.env.OPENSEARCH_DOCUMENT_INDEX;
export const embeddingIndex = process.env.OPENSEARCH_EMBEDDING_INDEX;

// create an OpenSearch client
export const client = new Client({
  ...AwsSigv4Signer({
    region: 'ap-northeast-2',
    service: 'es',
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: process.env.OPENSEARCH_NODE, // OpenSearch domain URL
});

export const convertEmbeddedTextToIndex = (
  embeddedText: EmbeddedText,
): EmbeddingIndex => {
  return {
    vector: embeddedText.vector,
    page: embeddedText.page,
    index: embeddedText.index,
    document_id: embeddedText.documentId.toString(),
    user_id: embeddedText.userId,
    document_type: embeddedText.type,
  };
};

export const convertDocumentToIndex = (
  document: Doc,
  content: string,
): DocumentIndex => {
  return {
    title: document.title,
    content: content,
    user_id: document.user_id,
    document_id: document.id.toString(),
    document_type: document.type,
  };
};

export const insertEmbeddedTextsToSearchEngine = async (
  embeddedTexts: EmbeddedText[],
) => {
  try {
    // 여러 chunk를 한번에 넣기 위해 bulk API 사용
    const body = embeddedTexts.flatMap((embeddedText) => [
      { index: { _index: embeddingIndex } },
      convertEmbeddedTextToIndex(embeddedText),
    ]);

    await client.bulk({ body });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const insertDocumentToSearchEngine = async (
  document: Doc,
  content: string,
) => {
  try {
    await client.index({
      index: documentIndex,
      body: convertDocumentToIndex(document, content),
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const deleteEmbeddedTextsFromSearchEngine = async (
  documentId: number,
) => {
  await client.deleteByQuery({
    index: embeddingIndex,
    body: {
      query: {
        match: {
          document_id: documentId,
        },
      },
    },
  });

  await client.deleteByQuery({
    index: documentIndex,
    body: {
      query: {
        match: {
          document_id: documentId,
        },
      },
    },
  });
};

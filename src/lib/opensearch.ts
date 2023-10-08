import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { EmbeddedText, SearchIndex } from '../types';

export const index = process.env.OPENSEARCH_INDEX;

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

export const convertToSearchIndex = (
  embeddedText: EmbeddedText,
): SearchIndex => {
  return {
    document_id: embeddedText.documentId,
    user_id: embeddedText.userId,
    document_type: embeddedText.type,
    content: embeddedText.content,
    vector: embeddedText.vector,
  };
};

export const insertEmbeddedTextsToSearchEngine = async (
  embeddedTexts: EmbeddedText[],
) => {
  const body = embeddedTexts.flatMap((embeddedText) => [
    { index: { _index: index } },
    convertToSearchIndex(embeddedText),
  ]);

  // console.log(body);

  await client.bulk({ body });
};

export const deleteEmbeddedTextsFromSearchEngine = async (
  documentId: number,
) => {
  await client.deleteByQuery({
    index,
    body: {
      query: {
        match: {
          document_id: documentId,
        },
      },
    },
  });

  // console.log(`Deleted document ${documentId} from OpenSearch`);
};

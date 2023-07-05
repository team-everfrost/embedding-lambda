import 'dotenv/config';
import { Document } from 'langchain/document';
import { insertDocs, pineconeInit, searchDocsWithScore } from './lib/pinecone';

export const handler = async (event) => {
  await pineconeInit();
  for (const record of event.Records) {
    const messageAttributes = record.messageAttributes;
    const messageBody = record.body;
    // const docId = messageBody.docId;
    console.log(messageBody.text);
    // TODO: DB에서 Docid를 통해 가져오기
    // TODO: 전처리
    const newDoc = new Document({
      metadata: { type: 'memo' },
      pageContent: messageBody.text,
    });
    await insertDocs([newDoc]);
    console.log(await searchDocsWithScore('바다', 10, { type: 'memo' }));
    // TODO: DB에 상태 저장
  }
};

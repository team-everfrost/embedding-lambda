import 'dotenv/config';
import { Status, changeDocStatus, client, findDoc } from './lib/db';
import { insertDocs, pineconeInit } from './lib/pinecone';
import { preprocess } from './preprocess';

export const handler = async (event) => {
  await client.connect();
  await pineconeInit();

  for (const record of event.Records) {
    // const messageAttributes = record.messageAttributes;
    const messageBody = record.body;
    const docId = messageBody.docId;

    // DB에서 Docid를 통해 가져오기
    let doc: any;

    try {
      doc = await findDoc(docId);
      // 중복 처리 방지
      if (doc?.status !== Status.EMBED_PENDING) continue;
    } catch (e) {
      console.error(e);
      continue;
    }

    // 해당 Doc의 상태를 처리중으로 변경
    await changeDocStatus(docId, Status.EMBED_PROCESSING);

    try {
      // TODO: 전처리 - Doc으로 변환
      const docs = await preprocess(doc);
      await insertDocs(docs);
    } catch (e) {
      console.error(e);
      await changeDocStatus(docId, Status.EMBED_REJECTED);
      continue;
    }

    // DB에 상태 저장
    await changeDocStatus(docId, Status.COMPLETED);
  }

  // console.log(
  //   JSON.stringify(
  //     await searchDocsWithScore('바다', 10, { userId: '2' }),
  //     null,
  //     2,
  //   ),
  // );

  await client.clean();
  await client.end();
  return;
};

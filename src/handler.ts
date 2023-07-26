import { createEmbeds } from './embed/embed';
import { preprocess } from './embed/preprocess';
import {
  Status,
  changeDocStatus,
  client,
  findDoc,
  insertEmbeds,
} from './lib/db';

export const handler = async (event) => {
  await client.connect();

  for (const record of event.Records) {
    const messageBody = JSON.parse(record.body);
    const documentId = messageBody.documentId;

    // DB에서 Docid를 통해 가져오기
    let doc: any;

    try {
      doc = await findDoc(documentId);
      // 중복 처리 방지
      if (
        doc?.status !== Status.EMBED_PENDING &&
        doc?.status !== Status.EMBED_REJECTED
      )
        continue;
    } catch (e) {
      console.error(e);
      continue;
    }

    // 해당 Doc의 상태를 처리중으로 변경
    await changeDocStatus(documentId, Status.EMBED_PROCESSING);

    try {
      // TODO: 전처리 - Doc으로 변환
      const parsedContent = await preprocess(doc);
      const embeddedTexts = await createEmbeds(
        documentId,
        doc.user_id,
        doc.type,
        parsedContent,
      );
      await insertEmbeds(embeddedTexts);
    } catch (e) {
      console.error(e);
      await changeDocStatus(documentId, Status.EMBED_REJECTED);
      continue;
    }

    // DB에 상태 저장
    await changeDocStatus(documentId, Status.COMPLETED);
  }

  await client.clean();
  await client.end();
  return;
};

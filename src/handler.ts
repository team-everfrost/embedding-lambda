import { createEmbeds } from './embed/embed';
import { clean, parse } from './embed/preprocess';
import {
  Status,
  changeDocStatus,
  client,
  deleteEmbeds,
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
      throw e; // 명시적으로 에러를 던져서 DLQ로 이동
    }

    // 해당 Doc의 상태를 처리중으로 변경
    await changeDocStatus(documentId, Status.EMBED_PROCESSING);

    try {
      // 문서 전처리
      const cleanDoc = clean(doc);

      // 문서 분할
      const parsedContent = await parse(cleanDoc);

      // 기존 임베딩 삭제
      await deleteEmbeds(documentId);

      // 임베딩
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
      throw e; // 명시적으로 에러를 던져서 DLQ로 이동
    }

    // DB에 상태 저장
    await changeDocStatus(documentId, Status.COMPLETED);
  }

  await client.clean();
  await client.end();
  return;
};

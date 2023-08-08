import { createEmbeds } from './embed/embed';
import { clean, parse } from './embed/preprocess';
import {
  Status,
  changeDocStatus,
  changeHashtags,
  changeSummary,
  client,
  deleteEmbeds,
  findDoc,
  insertEmbeds,
} from './lib/db';
import { getSummary } from './lib/openai';

export const handler = async (event) => {
  await client.connect();

  for (const record of event.Records) {
    const messageBody =
      typeof record.body === 'string' ? JSON.parse(record.body) : record.body;
    const documentId = messageBody.documentId;

    // DB에서 Docid를 통해 가져오기
    const doc = await findDoc(documentId);
    // 중복 처리 방지
    if (
      doc?.status !== Status.EMBED_PENDING &&
      doc?.status !== Status.EMBED_REJECTED
    )
      continue;

    // 해당 Doc의 상태를 처리중으로 변경
    await changeDocStatus(documentId, Status.EMBED_PROCESSING);

    try {
      // 문서 전처리
      const cleanDoc = clean(doc);

      const tasks = [];

      // 요약, 태그 생성
      const summaryTask = getSummary(cleanDoc).then(
        async ({ summary, hashtags }) => {
          await Promise.all([
            changeSummary(documentId, summary),
            changeHashtags(documentId, doc.user_id, hashtags),
          ]);

          return summary;
        },
      );

      tasks.push(summaryTask);

      // 요약, 태그 생성 작업과 병렬로 문서를 분할
      const parsedContentTask = parse(cleanDoc);

      tasks.push(parsedContentTask);

      // 요약과 문서 분할 작업이 모두 완료되면 임베딩 작업 수행
      const results = await Promise.all(tasks);

      const summary = results[0];
      const parsedContent = results[1];

      // 기존 임베딩 삭제
      await deleteEmbeds(documentId);

      // 요약 임베딩 생성 및 삽입
      const summaryEmbeds = await createEmbeds(
        documentId,
        doc.user_id,
        doc.type,
        [{ chapter: 'summary', page: 1, content: summary }],
      );
      await insertEmbeds(summaryEmbeds);

      // 본문 임베딩 생성 및 삽입
      const embeddedTexts = await createEmbeds(
        documentId,
        doc.user_id,
        doc.type,
        parsedContent,
      );
      await insertEmbeds(embeddedTexts);
    } catch (e) {
      await changeDocStatus(documentId, Status.EMBED_REJECTED);
      throw e; // 명시적으로 에러를 던져서 DLQ로 이동
    }

    // DB에 상태 저장
    await changeDocStatus(documentId, Status.COMPLETED);
  }

  await client.clean();
  await client.end();
};

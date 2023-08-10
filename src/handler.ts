import { createEmbeds } from './embed/embed';
import { parseMemo } from './embed/preprocess/memo';
import { parseTxt } from './embed/preprocess/txt';
import { parseWebpage } from './embed/preprocess/webpage';
import {
  changeContent,
  changeDocStatus,
  changeHashtags,
  changeSummary,
  client,
  deleteEmbeds,
  findDoc,
  insertEmbeds,
} from './lib/db';
import { getSummary } from './lib/openai';
import { Doc, ParsedContent, Status } from './types';

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
      // 확장자: 파서 매핑
      const fileParser = {
        txt: parseTxt,
      };

      let parseFunc: (
        doc: Doc,
      ) => Promise<{ parsedContent: ParsedContent[]; content: string }>;
      switch (doc.type) {
        case 'MEMO':
          parseFunc = parseMemo;
          break;
        case 'WEBPAGE':
          parseFunc = parseWebpage;
          break;
        case 'IMAGE':
        case 'FILE':
          const fileExtension = doc.title.split('.').pop().toLowerCase();
          if (!(fileExtension in fileParser))
            throw new Error('Not supported file type');
          parseFunc = fileParser[fileExtension];
          break;
      }

      const { parsedContent, content } = await parseFunc(doc);

      const tasks = [];

      // 요약, 태그 생성
      const summaryTask = getSummary(doc.title, content).then(
        async ({ summary, hashtags }) => {
          await Promise.all([
            changeSummary(documentId, summary),
            changeHashtags(documentId, doc.user_id, hashtags),
          ]);
          return summary;
        },
      );
      tasks.push(summaryTask);

      // 파일 파싱의 경우 DB content에 파싱 내용 저장
      if (doc.type === 'IMAGE' || doc.type === 'FILE') {
        const contentTask = changeContent(documentId, content);
        tasks.push(contentTask);
      }

      // 요약과 문서 저장 동시에 진행
      const results = await Promise.all(tasks);

      const summary = results[0];

      // 기존 임베딩 삭제
      await deleteEmbeds(documentId);

      const summaryEmbedPromise = createEmbeds(
        documentId,
        doc.user_id,
        doc.type,
        [{ chapter: 'summary', page: 1, content: summary }],
      ).then(insertEmbeds);

      const embeddedTextsPromise = createEmbeds(
        documentId,
        doc.user_id,
        doc.type,
        parsedContent,
      ).then(insertEmbeds);

      await Promise.all([summaryEmbedPromise, embeddedTextsPromise]);
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

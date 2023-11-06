import { createEmbeds } from './embed/embed';
import {
  changeContent,
  changeDocStatus,
  changeHashtags,
  changeSummary,
  client,
  findDoc,
  findUid,
} from './lib/db';
import { getSummary } from './lib/openai';
import {
  deleteEmbeddedTextsFromSearchEngine,
  insertDocumentToSearchEngine,
  insertEmbeddedTextsToSearchEngine,
} from './lib/opensearch';
import { promiseTimeout } from './lib/timeout';
import { parse } from './parser';
import { Doc, Status } from './types';

export const handler = async (event, context) => {
  await client.connect();

  for (const record of event.Records) {
    const messageBody =
      typeof record.body === 'string' ? JSON.parse(record.body) : record.body;
    const documentId = messageBody.documentId;

    console.log('documentId: ' + documentId);

    // DB에서 Docid를 통해 가져오기
    const doc = await findDoc(documentId);
    // User UUID 찾아서 넣어줌
    doc.uid = (await findUid(doc.user_id)).uid;

    // 중복 처리 방지
    if (
      doc?.status !== Status.EMBED_PENDING &&
      doc?.status !== Status.EMBED_REJECTED
    )
      continue;

    console.log('doc uuid: ' + doc.uid);
    console.log('doc type: ' + doc.type);
    console.log('before status: ' + doc.status);

    // 해당 Doc의 상태를 처리중으로 변경
    await changeDocStatus(documentId, Status.EMBED_PROCESSING);

    try {
      // lambda 제한시간 1분 전 timeout
      await promiseTimeout(
        context.getRemainingTimeInMillis() - 60000,
        job(doc, documentId),
      );
    } catch (e) {
      console.log('embedding failed');
      await changeDocStatus(documentId, Status.EMBED_REJECTED);
      throw e; // 명시적으로 에러를 던져서 DLQ로 이동
    }

    // DB에 상태 저장
    await changeDocStatus(documentId, Status.COMPLETED);
  }

  await client.clean();
  await client.end();
};

const job = async (doc: any, documentId: number) => {
  // 나눠진 문서 내용, 전체 문서 내용
  const { parsedContent, content } = await parse(doc);

  // 파일 파싱의 경우 DB content에 파싱 내용 저장
  if (doc.type === 'IMAGE' || doc.type === 'FILE') {
    await changeContent(documentId, content);
  }

  try {
    const summaryPromise = summaryJob(doc, documentId, content);
    const embeddingPromise = embeddingJob(doc, documentId, parsedContent);

    // 검색 엔진에 존재하는 기존 임베딩 삭제
    await deleteEmbeddedTextsFromSearchEngine(documentId);

    const [summaryData, embeddedTexts] = await Promise.all([
      summaryPromise,
      embeddingPromise,
    ]);

    const allEmbeddedTexts = [
      ...summaryData.metadataEmbeddedTexts,
      ...embeddedTexts,
    ];

    await Promise.all([
      // 검색 엔진에 문서 추가
      // HTML 태그 제거된 content 삽입
      insertDocumentToSearchEngine(doc, content, summaryData.summary),
      // 검색 엔진에 임베딩 추가
      insertEmbeddedTextsToSearchEngine(allEmbeddedTexts),
    ]);
  } catch (e) {
    console.error('job failed');
    throw e;
  }
};

const summaryJob = async (doc: Doc, documentId: number, content: string) => {
  // 요약, 태그 생성
  const summary = await getSummary(doc.title, doc.type, content)
    .then(async ({ summary, hashtags }) => {
      await Promise.all([
        // DB에 저장
        changeSummary(documentId, summary),
        changeHashtags(documentId, doc.user_id, hashtags),
      ]);
      return summary;
    })
    .catch((e) => {
      console.error('summaryJob failed');
      throw e;
    });

  const metaContent =
    doc.type === 'WEBPAGE' ? doc.title + '\n' + summary : summary;

  const metadataEmbeddedTexts = await createEmbeds(
    documentId,
    doc.user_id,
    doc.type,
    [{ chapter: 'metadata', page: 1, content: metaContent }],
  );

  return {
    summary,
    metadataEmbeddedTexts,
  };
};

const embeddingJob = async (
  doc: Doc,
  documentId: number,
  parsedContent: any[],
) => {
  const parsedContentEmbeddedTexts = await createEmbeds(
    documentId,
    doc.user_id,
    doc.type,
    parsedContent,
  );

  return parsedContentEmbeddedTexts;
};

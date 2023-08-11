import { createCanvas } from 'canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { changeThumbnailUrl } from '../lib/db';
import { readFile, writeThumbnail } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

const extractTextAndThumbnailFromPDF = async (byteArray: Uint8Array) => {
  const pdf = await getDocument(byteArray).promise;
  const texts: string[] = [];
  let thumbnail = Buffer.alloc(0);

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 1.0 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const textContent = await page.getTextContent();
    const textItems = textContent.items;
    const text = textItems.map((item: TextItem) => item.str).join(' ');
    texts.push(text);

    if (i === 0) {
      thumbnail = canvas.toBuffer();
    }
  }

  return {
    content: texts,
    thumbnail: thumbnail,
  };
};

export const parsePdf = async (
  doc: Doc,
): Promise<{ parsedContent: ParsedContent[]; content: string }> => {
  const byteArray = await readFile(doc.doc_id);

  const { content: extractContent, thumbnail } =
    await extractTextAndThumbnailFromPDF(byteArray);

  //추출된 텍스트 후처리 (여러칸 공백 한칸으로)
  const content = extractContent.map((text) => text.replace(/\s+/g, ' '));

  const thumbnailPromise = writeThumbnail(doc.uid, doc.doc_id, thumbnail);
  const dbthumbnailPromise = changeThumbnailUrl(
    doc.id,
    process.env.THUMBNAIL_DOMAIN + '/' + doc.uid + '/' + doc.doc_id + '.png',
  );

  const parsedContent: ParsedContent[] = [];
  for (let i = 0; i < content.length; i++) {
    parsedContent.push({
      chapter: doc.title,
      page: i + 1,
      content: content[i],
    });
  }

  await Promise.all([thumbnailPromise, dbthumbnailPromise]);

  return { parsedContent, content: content.join('\n\n') };
};

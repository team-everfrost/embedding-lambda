import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { readFile } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

const extractTextFromPDF = async (byteArray: Uint8Array) => {
  const pdf = await getDocument(byteArray).promise;
  const texts: string[] = [];

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);

    const textContent = await page.getTextContent();
    const textItems = textContent.items;
    const text = textItems.map((item: TextItem) => item.str).join(' ');
    texts.push(text);
  }

  return texts;
};

export const parsePdf = async (
  doc: Doc,
): Promise<{ parsedContent: ParsedContent[]; content: string }> => {
  const byteArray = await readFile(doc.doc_id);

  const extractContent = await extractTextFromPDF(byteArray);

  //추출된 텍스트 후처리 (여러칸 공백 한칸으로)
  const content = extractContent.map((text) => text.replace(/\s+/g, ' '));

  const parsedContent: ParsedContent[] = [];
  for (let i = 0; i < content.length; i++) {
    parsedContent.push({
      chapter: doc.title,
      page: i + 1,
      content: content[i],
    });
  }

  return { parsedContent, content: content.join('\n\n') };
};

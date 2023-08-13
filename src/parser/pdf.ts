import { readFile } from '../lib/s3';
import { Doc, ParsedContent } from '../types';

const extractTextFromPDF = async (byteArray: Uint8Array): Promise<string[]> => {
  const { default: pdfjs } = await import(
    'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js'
  );
  const { getDocument } = pdfjs;

  const pdf = await getDocument(byteArray).promise;

  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageTexts = textContent.items.map((item) => item.str);
    texts.push(pageTexts.join(' '));
  }

  return texts;
};

export const parsePdf = async (
  doc: Doc,
): Promise<{ parsedContent: ParsedContent[]; content: string }> => {
  const byteArray = await readFile(doc.doc_id);

  const extractContent = await extractTextFromPDF(byteArray);

  // Post-process the extracted text (replace multiple spaces with a single space)
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

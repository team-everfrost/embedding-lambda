import { Doc, ParsedContent } from '../types';
import { parseMemo } from './memo';
import { parsePdf } from './pdf';
import { parseTxt } from './txt';
import { parseWebpage } from './webpage';

// 확장자: 파서 매핑
const fileParser = {
  txt: parseTxt,
  pdf: parsePdf,
};

export const parse = async (
  doc: Doc,
): Promise<{ parsedContent: ParsedContent[]; content: string }> => {
  console.log('Parsing: ' + doc.title);

  if (doc.type === 'MEMO') return await parseMemo(doc);
  if (doc.type === 'WEBPAGE') return await parseWebpage(doc);
  if (doc.type === 'IMAGE' || doc.type === 'FILE') {
    const fileExtension = doc.title.split('.').pop().toLowerCase();
    if (!(fileExtension in fileParser))
      throw new Error('Not supported file type: ' + fileExtension);
    return await fileParser[fileExtension](doc);
  }
};

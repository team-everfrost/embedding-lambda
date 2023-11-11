export class Prompt {
  language: string;
  temperature: number;
  prompt: string;
  functions: any[];

  title: string; // 문서 제목
  type: string; // 문서 타입 (MEMO, WEBPAGE, IMAGE, FILE)
  content: string; // 문서 내용 (최대 3000자)
  input: string; // 웹페이지의 경우 제목 + 내용, 이외의 경우 내용

  constructor(
    language: string,
    temperature: number,
    title: string,
    type: string,
    content: string,
  ) {
    this.language = language;
    this.temperature = temperature;
    this.prompt = `You are a helpful AI assistant for a busy journalist.
The journalist has asked you to write a summary and extract hashtags of the following ${this.type}.
---
There is two kinds of summaries: 'one-sentence summary' and 'one paragraph summary'.
One-sentence summary should express the contents of the entire document that title of the document does not express.
One paragraph summary should enable user to grasp all the core contents of the ${this.type} without having to read the entire article.
Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
Rely strictly on the provided text, without including external information.
---
Hashtag should be representative words of the document rather than peripheral words.
Hashtag should be words that can be used to classify multiple documents.
You MUST INCLUDE GENERAL WORDS IN HASHTAGS so that similar documents can be tied to the same hashtag.
---
You MUST use ${this.language} for the summary and hashtag.
---
`;
    this.functions = [
      {
        name: 'insertMetadata',
        description: `Inserts summary and hashtags into the ${this.type} metadata`,
        parameters: {
          type: 'object',
          properties: {
            oneLineSummary: {
              type: 'string',
              description: `a concise summary of the entire ${this.type} within one sentence, using ${this.language}`,
            },
            summary: {
              type: 'string',
              description: `concise, one-paragraph or less summary of the entire ${this.type}, using ${this.language}`,
            },
            hashtags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: `A list of hashtags for the ${this.type}, using ${this.language} or English proper nouns and abbreviations`,
            },
          },
          required: ['oneLineSummary', 'summary', 'hashtags'],
        },
      },
    ];
    this.title = title;
    this.type = type;
    this.content = content;
    this.input = getInput(title, type, content);
  }
}

const getInput = (title: string, type: string, content: string) => {
  if (type === 'WEBPAGE') {
    return `Title: ${title}
    Content: ${content}`;
  }
  if (type === 'IMAGE') {
    const caption = content.split('\n')[0];
    const ocrText = content.split('\n').slice(1).join('\n');
    return `Caption: ${caption}
OCR Text: ${ocrText}`;
  }

  if (type === 'FILE') {
    return `Filename: ${title}
    Content: ${content}`;
  }

  return `Content: ${content}`;
};

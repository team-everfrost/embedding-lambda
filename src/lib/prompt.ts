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
There are two kinds of summaries: 'One-Sentence Summary' and 'One-Paragraph Summary'.
The One-Sentence Summary should express the key points of the document that are not immediately apparent from the title, in a single concise sentence.
The One-Paragraph Summary should enable the user to grasp all the core contents of the ${this.type} without having to read the entire article. It should be no longer than 5 sentences.
Craft summaries that are detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
Rely strictly on the provided text, without including external information.
---
Hashtags should be representative words or phrases from the document, not peripheral terms.
They should be words that can be used to classify multiple documents.
Include both specific and general terms in the hashtags to ensure similar documents can be linked.
Provide 3-5 hashtags, formatted as single words or compound words without spaces or any special characters (e.g., AI, ClimateChange, Backend, Spring ,Node.js, Kotlin).
Do NOT include the '#' symbol before the hashtags.
---
For IMAGE type, focus on describing visual elements and any text present in the image.
For FILE type, consider the filename in your analysis if it provides relevant context.
---
You MUST use ${this.language} for the summaries and hashtags, except for proper nouns or widely recognized abbreviations which can be in English.
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
              description: `A list of 3-5 hashtags for the ${this.type}, using ${this.language} or English proper nouns and abbreviations, without '#' symbol`,
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

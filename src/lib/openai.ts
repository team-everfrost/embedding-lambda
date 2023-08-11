import { Configuration, OpenAIApi } from 'openai';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export const getEmbedding = async (text: string) => {
  try {
    const result = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return result.data.data[0].embedding;
  } catch (e) {
    if (e.response) {
      console.error(e.response.status);
      console.error(e.response.data);
    } else {
      console.error(e);
    }

    throw e;
  }
};

export const getSummary = async (title: string, content: string) => {
  // content 길이가 3000자 이상이면 앞 1000자, 중간 1000자, 뒤 1000자를 합쳐서 요약
  const length = content.length;
  let inputContent: string;
  if (length > 3000) {
    inputContent =
      content.slice(0, 1000) +
      '\n\n...\n\n' +
      content.slice(length / 2 - 500, length / 2 + 500) +
      '\n\n...\n\n' +
      content.slice(length - 1000, length);
  } else {
    inputContent = content;
  }

  const input = title + '\n' + inputContent;

  try {
    const model = 'gpt-3.5-turbo';
    const language = 'Korean';
    const prompt = `You are a helpful AI assistant for a busy journalist.
  The journalist has asked you to write a summary and hashtags of the following article.
  A one-line summary is a sentence that expresses the contents of the entire document, not the title of the document. It should be a concise one sentence.
  The summary is a summary of the document and should be concise and concise, within one paragraph.
  Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness.
  Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
  Rely strictly on the provided text, without including external information.
  Tags should be representative words of the document rather than peripheral words.
  Tags should be words that can be used to classify multiple documents.
  You MUST use presented language in the article for the summary and hashtags.
  ---
  Language: ${language}
  Article: \n
  `;

    const completion = await openai.createChatCompletion({
      model: model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input },
      ],
      temperature: 0,
      functions: [
        {
          name: 'insertMetadata',
          description: 'Inserts summary and hashtags into the article metadata',
          parameters: {
            type: 'object',
            properties: {
              oneLineSummary: {
                type: 'string',
                description:
                  'a concise summary of the entire document within one sentence',
              },
              summary: {
                type: 'string',
                description:
                  'concise, one-paragraph or less summary of the entire document',
              },
              hashtags: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'A list of hashtags for the article',
              },
            },
            required: ['shortSummary', 'summary', 'hashtags'],
          },
        },
      ],
      function_call: {
        name: 'insertMetadata',
      },
    });

    const result: { oneLineSummary: string; summary: string; hashtags: [] } =
      JSON.parse(completion.data.choices[0].message.function_call.arguments);

    return {
      summary: result.oneLineSummary + '\n' + result.summary,
      hashtags: result.hashtags,
    };
  } catch (e) {
    if (e.response) {
      console.error(e.response.status);
      console.error(e.response.data);
    } else {
      console.error(e);
    }

    throw e;
  }
};

import { isWithinTokenLimit } from 'gpt-tokenizer';
import OpenAI from 'openai';
import { Prompt } from './prompt';

const config = {
  apiKey: process.env.OPENAI_API_KEY,
};

const GPT_MODEL = 'gpt-4o';
const TOKEN_LIMIT = 128_000;
const EMBEDDING_MODEL = 'text-embedding-ada-002';

const openai = new OpenAI(config);

export const getEmbedding = async (text: string) => {
  try {
    const result = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return result.data[0].embedding;
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

export const getSummary = async (
  title: string,
  type: string,
  content: string,
) => {
  const inputContent = getSlice(content);

  try {
    const model = GPT_MODEL;
    const language = 'Korean'; // TODO: 사용자가 입력할 수 있도록 변경
    const prompt: Prompt = new Prompt(language, 0, title, type, inputContent);
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: prompt.prompt },
        { role: 'user', content: prompt.input },
        {
          role: 'system',
          content: `respond ${prompt.language}`,
        },
      ],
      temperature: prompt.temperature,
      tools: prompt.functions.map((func) => ({
        type: 'function',
        function: func,
      })),
      tool_choice: {
        type: 'function',
        function: { name: 'insertMetadata' },
      },
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'insertMetadata') {
      throw new Error('Unexpected response from OpenAI API');
    }

    const result: {
      oneLineSummary: string;
      summary: string;
      hashtags: string[];
    } = JSON.parse(toolCall.function.arguments);

    // onelineSummary에서 엔터 제거
    result.oneLineSummary = result.oneLineSummary.replace(/\n/g, '');

    // hashtags 맨 앞에 #이 존재하는 경우 제거
    result.hashtags = result.hashtags.map((hashtag) =>
      hashtag.replace(/^#/, ''),
    );

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

const getSlice = (content: string): string => {
  const length = content.length;
  let inputContent = content;
  let withinTokenLimit = isWithinTokenLimit(inputContent, TOKEN_LIMIT);
  if (withinTokenLimit) return inputContent;

  inputContent =
    content.slice(0, TOKEN_LIMIT / 3) +
    '\n\n...\n\n' +
    content.slice(length / 2 - TOKEN_LIMIT / 6, length / 2 + TOKEN_LIMIT / 6) +
    '\n\n...\n\n' +
    content.slice(length - TOKEN_LIMIT / 3, length);
  withinTokenLimit = isWithinTokenLimit(inputContent, TOKEN_LIMIT);
  if (withinTokenLimit) return inputContent;

  inputContent =
    content.slice(0, TOKEN_LIMIT / 3) +
    '\n\n...\n\n' +
    content.slice(length - TOKEN_LIMIT / 3, length);
  withinTokenLimit = isWithinTokenLimit(inputContent, TOKEN_LIMIT);
  if (withinTokenLimit) return inputContent;

  inputContent =
    content.slice(0, TOKEN_LIMIT / 6) +
    '\n\n...\n\n' +
    content.slice(length - TOKEN_LIMIT / 6, length);
  return inputContent;
};

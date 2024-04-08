import { isWithinTokenLimit } from 'gpt-tokenizer';
import OpenAI from 'openai';
import { Prompt } from './prompt';

const config = {
  apiKey: process.env.OPENAI_API_KEY,
};

const GPT_MODEL = 'gpt-3.5-turbo';
const TOKEN_LIMIT = 6000; // 최대 16384
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
      temperature: 0,
      // TODO: tools로 변경
      functions: prompt.functions,
      function_call: {
        name: 'insertMetadata',
      },
    });

    // TODO: JSON에 double quote가 들어가면 오류가 발생함.
    const result: { oneLineSummary: string; summary: string; hashtags: [] } =
      JSON.parse(completion.choices[0].message.function_call.arguments);

    // onelineSummary에서 엔터 제거
    result.oneLineSummary = result.oneLineSummary.replace(/\n/g, '');

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

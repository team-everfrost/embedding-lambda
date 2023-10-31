import OpenAI from 'openai';
import { Prompt } from './prompt';

const config = {
  apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI(config);

export const getEmbedding = async (text: string) => {
  try {
    const result = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
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

  try {
    const model = 'gpt-3.5-turbo';
    const language = 'Korean'; // TODO: 사용자가 입력할 수 있도록 변경
    const prompt: Prompt = new Prompt(language, 0, title, type, inputContent);
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: prompt.prompt },
        { role: 'user', content: prompt.input },
      ],
      temperature: 0,
      functions: prompt.functions,
      function_call: {
        name: 'insertMetadata',
      },
    });

    // TODO: JSON에 double quote가 들어가면 오류가 발생함.
    const result: { oneLineSummary: string; summary: string; hashtags: [] } =
      JSON.parse(completion.choices[0].message.function_call.arguments);

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

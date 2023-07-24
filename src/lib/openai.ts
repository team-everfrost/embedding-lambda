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

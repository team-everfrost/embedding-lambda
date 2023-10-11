import axios, { AxiosResponse } from 'axios';

const AZURE_OCR_ENDPOINT = process.env.AZURE_OCR_ENDPOINT;
const AZURE_OCR_KEY = process.env.AZURE_OCR_KEY;

export const getOcrResult = async (imageUrl: string) => {
  const url = `${AZURE_OCR_ENDPOINT}/computervision/imageanalysis:analyze?features=caption,read&model-version=latest&api-version=2023-04-01-preview`;
  const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': AZURE_OCR_KEY,
  };
  const body = {
    url: imageUrl,
  };

  const response = await fetchWithRetry(url, body, headers);
  const caption = response.data?.captionResult?.text ?? '';
  const text = response.data?.readResult?.content ?? '';

  return { caption, text };
};

export const fetchWithRetry = async (
  url: string,
  body: any,
  headers: any,
  retries: number = 2,
): Promise<AxiosResponse> => {
  try {
    const response = await axios.post(url, body, { headers });
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      return fetchWithRetry(url, body, headers, retries - 1);
    } else {
      throw error; // 모든 재시도가 실패하면 에러를 throw합니다.
    }
  }
};

// src/main/api/adapters/deepseek.ts
import OpenAI from 'openai';
import { ApiProvider, ApiResponse } from '../../../renderer/types';

export async function callDeepSeek(
  provider: ApiProvider,
  prompt: string,
  apiKey: string
): Promise<Partial<ApiResponse>> {
  // Point the OpenAI SDK at DeepSeek's endpoint
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  try {
    const startTime = Date.now();

    const completion = await client.chat.completions.create({
      model: provider.settings.model || 'deepseek-chat', // e.g. 'deepseek-chat' or 'deepseek-coder'
      messages: [{ role: 'user', content: prompt }],
      max_tokens: provider.settings.max_tokens,
    });

    const endTime = Date.now();

    return {
      status: 'success',
      content: completion.choices?.[0]?.message?.content ?? '',
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: completion.usage?.prompt_tokens ?? 0,
        completion: completion.usage?.completion_tokens ?? 0,
      },
    };
  } catch (err: any) {
    const msg =
      err?.error?.message || err?.response?.data?.error?.message || err?.message || 'An unexpected error occurred.';
    console.error('DeepSeek SDK Error:', msg);
    return { status: 'error', error: msg, responseTime: 0 };
  }
}

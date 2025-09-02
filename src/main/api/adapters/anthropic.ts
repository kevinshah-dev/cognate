import Anthropic from '@anthropic-ai/sdk';
import { ApiProvider, ApiResponse } from '../../../renderer/types';

export async function callAnthropic(
  provider: ApiProvider,
  prompt: string,
  apiKey: string
): Promise<Partial<ApiResponse>> {
  const client = new Anthropic({ apiKey });

  try {
    const startTime = Date.now();

    const msg = await client.messages.create({
      model: provider.settings.model || 'claude-opus-4-1-20250805',
      max_tokens: provider.settings.max_tokens,          // output token cap (Anthropic uses max_tokens)
      messages: [{ role: 'user', content: prompt }],
    });

    const endTime = Date.now();

    // Collect text blocks from the response
    const text =
      Array.isArray(msg.content)
        ? msg.content
            .filter((c: any) => c?.type === 'text' && typeof c.text === 'string')
            .map((c: any) => c.text)
            .join('\n')
        : '';

    return {
      status: 'success',
      content: text,
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: msg.usage?.input_tokens ?? 0,
        completion: msg.usage?.output_tokens ?? 0,
      },
    };
  } catch (err: any) {
    const message =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      'An unexpected error occurred.';
    console.error('Anthropic SDK Error:', message);
    return { status: 'error', error: message, responseTime: 0 };
  }
}

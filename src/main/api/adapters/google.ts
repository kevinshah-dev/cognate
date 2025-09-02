// src/main/api/adapters/gemini.ts
import { GoogleGenAI } from '@google/genai';
import { ApiProvider, ApiResponse } from '../../../renderer/types';

export async function callGemini(
  provider: ApiProvider,
  prompt: string,
  apiKey: string
): Promise<Partial<ApiResponse>> {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const startTime = Date.now();

    // Uses the exact request shape from the new Google GenAI docs
    const response: any = await ai.models.generateContent({
      model: provider.settings.model || 'gemini-2.5-pro',
      contents: prompt,
    });

    const endTime = Date.now();
    console.log('response GEMINI', response);
    return {
      status: 'success',
      content: response?.text ?? '',
      responseTime: endTime - startTime,
      tokenUsage: {
        // usage fields differ across SDK versions; fall back safely
        prompt: response?.usage?.input_tokens ??
                response?.usageMetadata?.promptTokenCount ?? 0,
        completion: response?.usage?.output_tokens ??
                    response?.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  } catch (err: any) {
    const message =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      'An unexpected error occurred.';
    console.error('Gemini SDK Error:', message);
    return { status: 'error', error: message, responseTime: 0 };
  }
}

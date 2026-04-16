import OpenAI from "openai";
import { ApiProvider, ApiResponse } from "../../../renderer/types";

export async function callOpenAIImage(
  provider: ApiProvider,
  prompt: string,
  apiKey: string
): Promise<Partial<ApiResponse>> {
  const client = new OpenAI({ apiKey });

  try {
    const startTime = Date.now();
    //console.log("IMAGE PROMPT", provider);
    const response = await client.responses.create({
      model: provider.settings.model || "gpt-5",
      input: prompt,
      tools: [{ type: "image_generation" }],
    });
    console.log("IMAGE RESPONSE", response);
    // Collect base64 images from outputs
    const imageBase64s: string[] = [];
    for (const out of response.output ?? []) {
      if (out.type === "image_generation_call" && out.result) {
        imageBase64s.push(String(out.result));
      }
    }

    const endTime = Date.now();

    return {
      status: "success",
      kind: "image",
      content: "",
      images: imageBase64s.map((b64) => ({ mime: "image/png", base64: b64 })),
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: response.usage?.input_tokens ?? 0,
        completion: response.usage?.output_tokens ?? 0,
      },
    };
  } catch (err: any) {
    const msg =
      err?.error?.message || err?.message || "OpenAI image generation failed.";
    console.error("OpenAI Image Error:", msg);
    return { status: "error", error: msg, responseTime: 0 };
  }
}

import { GoogleGenAI, Modality } from "@google/genai";
import { ApiProvider, ApiResponse } from "../../../renderer/types";

export async function callGeminiImage(
  provider: ApiProvider,
  prompt: string,
  apiKey: string
): Promise<Partial<ApiResponse>> {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = provider.settings.model || "gemini-2.5-flash-image";

  try {
    const startTime = Date.now();

    if (modelId.startsWith("gemini-")) {
      const response: any = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
      const endTime = Date.now();

      const parts = (response?.candidates ?? []).flatMap(
        (candidate: any) => candidate?.content?.parts ?? []
      );
      const text = parts
        .map((part: any) => part?.text)
        .filter(Boolean)
        .join("\n\n");
      const images = parts
        .map((part: any) => {
          const data = part?.inlineData?.data;
          if (!data) return null;
          return {
            mime: part.inlineData.mimeType || "image/png",
            base64: String(data),
          };
        })
        .filter(Boolean) as { mime: string; base64: string }[];

      if (images.length === 0) {
        return {
          status: "error",
          error: "Gemini returned no images",
          responseTime: endTime - startTime,
        };
      }

      return {
        status: "success",
        kind: "image",
        content: text,
        images,
        responseTime: endTime - startTime,
        tokenUsage: {
          prompt:
            response?.usage?.input_tokens ??
            response?.usageMetadata?.promptTokenCount ??
            0,
          completion:
            response?.usage?.output_tokens ??
            response?.usageMetadata?.candidatesTokenCount ??
            0,
        },
      };
    }

    const response: any = await ai.models.generateImages({
      model: modelId,
      prompt,
      config: {
        numberOfImages: 1,
      },
    });
    const endTime = Date.now();

    const generated = Array.isArray(response?.generatedImages)
      ? response.generatedImages
      : [];

    if (generated.length === 0) {
      return {
        status: "error",
        error: "Gemini returned no images",
        responseTime: endTime - startTime,
      };
    }

    const images = generated
      .map((g: any) => {
        const b64 = g?.image?.imageBytes;
        if (!b64) return null;
        return { mime: "image/png", base64: String(b64) };
      })
      .filter(Boolean) as { mime: string; base64: string }[];

    return {
      status: "success",
      kind: "image",
      content: "",
      images,
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: 0,
        completion: 0,
      },
    };
  } catch (err: any) {
    const message =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      "Gemini image generation failed.";
    console.error("Gemini image generation error:", message);
    return { status: "error", error: message, responseTime: 0 };
  }
}

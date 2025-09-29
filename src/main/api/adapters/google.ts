// src/main/api/adapters/gemini.ts
import { GoogleGenAI } from "@google/genai";
import { ApiProvider, ApiResponse, Attachment } from "../../../renderer/types";

function isPdf(att?: Pick<Attachment, "type" | "name">) {
  if (!att) return false;
  const mimeOk = att.type === "application/pdf";
  const nameOk = att.name?.toLowerCase?.().endsWith(".pdf");
  return mimeOk || nameOk;
}

export async function callGemini(
  provider: ApiProvider,
  prompt: string,
  apiKey: string,
  attachments?: Attachment[]
): Promise<Partial<ApiResponse>> {
  const ai = new GoogleGenAI({ apiKey });

  try {
    const startTime = Date.now();

    const contents: any[] = [{ text: prompt || "Analyze the attached PDFs." }];

    if (attachments && attachments.length > 0) {
      for (const a of attachments) {
        if (!isPdf(a)) continue;

        const base64 = Buffer.from(a.data as ArrayBuffer).toString("base64");
        contents.push({
          inlineData: {
            mimeType: a.type || "application/pdf",
            data: base64,
          },
        });
      }
    }

    // Uses the exact request shape from the new Google GenAI docs
    const response: any = await ai.models.generateContent({
      model: provider.settings.model || "gemini-2.5-pro",
      contents,
    });

    const endTime = Date.now();
    console.log("response GEMINI", response);
    return {
      status: "success",
      content: response?.text ?? "",
      responseTime: endTime - startTime,
      tokenUsage: {
        // usage fields differ across SDK versions; fall back safely
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
  } catch (err: any) {
    const message =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      "An unexpected error occurred.";
    console.error("Gemini SDK Error:", message);
    return { status: "error", error: message, responseTime: 0 };
  }
}

import { GoogleGenAI } from "@google/genai";
import { ApiProvider, ApiResponse } from "../../../renderer/types";

export async function callGeminiImage(
    provider: ApiProvider,
    prompt: string,
    apiKey: string
): Promise<Partial<ApiResponse>> {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const startTime = Date.now();

        const modelId = "imagen-4.0-generate-001";

        const numberOfImages = 1;

        const response: any = await ai.models.generateImages({
            model: modelId,
            prompt,
            config: {
                numberOfImages,
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
        return {status: "error", error: message };
    }

}
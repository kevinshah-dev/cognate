import { ipcMain } from "electron";
import { ApiProvider, ApiResponse } from "../../renderer/types";
import { callOpenAI } from "./adapters/openai";
//import { callAnthropic } from './adapters/anthropic';
import { callDeepSeek } from "./adapters/deepseek";
import { callAnthropic } from "./adapters/anthropic";
import { callGemini } from "./adapters/google";

type GetApiKey = (providerId: string) => Promise<string | null | undefined>;

export function registerApiHandlers(getApiKey: GetApiKey) {
  // The main handler for all API requests from the renderer
  ipcMain.handle(
    "send-prompt",
    async (
      _event,
      payload: {
        provider: ApiProvider;
        prompt: string;
        attachments?: {
          id: string;
          name: string;
          type: string;
          size: number;
          data: ArrayBuffer;
        }[];
      }
    ): Promise<Partial<ApiResponse>> => {
      let apiKey: string | unknown;
      const { provider, prompt, attachments } = payload;

      switch (provider.id) {
        case "openai":
          const apiKey = await getApiKey("openai");
          if (!apiKey || typeof apiKey !== "string") {
            return { status: "error", error: "OpenAI API key is not set." };
          }
          return callOpenAI(provider, prompt, apiKey, attachments);

        case "anthropic":
          const apiKeyAnthropic = await getApiKey("anthropic");
          if (!apiKeyAnthropic || typeof apiKeyAnthropic !== "string") {
            return { status: "error", error: "Anthropic API key is not set." };
          }
          return callAnthropic(provider, prompt, apiKeyAnthropic);

        case "deepseek":
          const apiKeyDeepseek = await getApiKey("deepseek");
          console.log("apiKeyDeepseek", apiKeyDeepseek);
          if (!apiKeyDeepseek || typeof apiKeyDeepseek !== "string") {
            console.log("!apiKeyDeepseek", !apiKeyDeepseek);
            console.log("typeof apiKeyDeepseek", typeof apiKeyDeepseek);
            return { status: "error", error: "DeepSeek API key is not set." };
          }
          return callDeepSeek(provider, prompt, apiKeyDeepseek);

        case "google":
          const apiKeyGoogle = await getApiKey("google");
          if (!apiKeyGoogle || typeof apiKeyGoogle !== "string") {
            return { status: "error", error: "Google API key is not set." };
          }
          return callGemini(provider, prompt, apiKeyGoogle);

        default:
          return {
            status: "error",
            error: `Provider with ID "${provider.id}" is not supported.`,
          };
      }
    }
  );
}

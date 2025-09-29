// src/renderer/types.ts

declare global {
  interface Window {
    electronAPI: {
      getElectronVersion: () => Promise<string>;
      invoke: (channel: string, ...args: any[]) => Promise<any>;

      getApiKeys: () => Promise<{
        openai: string;
        anthropic: string;
        google: string;
        deepseek: string;
      }>;
      setApiKeys: (
        keys: Record<string, string>
      ) => Promise<{ success: boolean }>;

      listHistory: () => Promise<PromptEntry[]>;
      addHistory: (entry: {
        text: string;
        providers: string[];
        attachmentNames?: string[];
      }) => Promise<PromptEntry>;
      deleteHistory: (id: string) => Promise<{ success: boolean }>;
      clearHistory: () => Promise<{ success: boolean }>;
    };
  }
}

// Represents the status of an API call
export type ApiResponseStatus = "idle" | "loading" | "success" | "error";

// Defines a single AI provider that the user can select
export interface ApiProvider {
  id: string; // e.g., 'openai', 'anthropic'
  name: string; // e.g., 'OpenAI GPT-4', 'Claude 3 Opus'
  selected: boolean;
  settings: {
    model: string;
    max_tokens: number;
  };
}

// Represents the response from a single AI provider for a given prompt
export interface ApiResponse {
  id: string; // A unique ID for this response
  providerId: string; // Which provider generated this response
  status: ApiResponseStatus;
  content: string; // The generated text
  responseTime: number; // in milliseconds
  tokenUsage: {
    prompt: number;
    completion: number;
  };
  error?: string; // Error message if the status is 'error'
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string; // mime type, e.g. 'application/pdf'
  data: ArrayBuffer; // file bytes (renderer → main via IPC)
}

// Defines the shape of our global application state
export interface AppState {
  prompt: string;
  providers: ApiProvider[];
  responses: ApiResponse[];
  setPrompt: (prompt: string) => void;
  toggleProvider: (providerId: string) => void;
  updateProviderSettings: (
    providerId: string,
    settings: Partial<ApiProvider["settings"]>
  ) => void;
  sendPromptToApis: () => void;

  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  attachments: Attachment[];
  attachmentModalOpen: boolean;
  openAttachmentModal: () => void;
  closeAttachmentModal: () => void;
  addAttachments: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;

  currentView: View;
  goTo: (v: View) => void;

  // prompt history
  promptHistory: PromptEntry[];
  loadHistory: () => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export type View = "compare" | "library";

export type PromptEntry = {
  id: string;
  text: string;
  createdAt: number; // Date.now()
  providers: string[]; // ids selected when sent
  attachmentNames?: string[];
};

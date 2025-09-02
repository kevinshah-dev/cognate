// src/renderer/store.ts
import { create } from "zustand";
import { AppState, ApiProvider, ApiResponse, Attachment } from "./types";
import { v4 as uuidv4 } from "uuid";

function isPdf(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
function readAsArrayBuffer(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

const useAppStore = create<AppState>((set, get) => ({
  // --- STATE ---
  prompt: "",
  providers: [
    {
      id: "openai",
      name: "OpenAI GPT-5",
      selected: true,
      settings: { model: "gpt-5", max_tokens: 8192 },
    },
    {
      id: "anthropic",
      name: "Claude Opus 4.1",
      selected: true,
      settings: { model: "claude-opus-4-1-20250805", max_tokens: 8192 },
    },
    {
      id: "google",
      name: "Google Gemini",
      selected: false,
      settings: { model: "gemini-2.5-pro", max_tokens: 8192 },
    },
    {
      id: "deepseek",
      name: "DeepSeek V3.1",
      selected: false,
      settings: { model: "deepseek-chat", max_tokens: 8192 },
    },
  ],
  responses: [],

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  attachments: [],
  attachmentModalOpen: false,
  openAttachmentModal: () => set({ attachmentModalOpen: true }),
  closeAttachmentModal: () => set({ attachmentModalOpen: false }),

  addAttachments: async (files) => {
    const onlyPdfs = files.filter(isPdf);
    const newOnes: Attachment[] = [];
    for (const f of onlyPdfs) {
      const data = await readAsArrayBuffer(f);
      newOnes.push({
        id: uuidv4(),
        name: f.name,
        size: f.size,
        type: f.type || "application/pdf",
        data,
      });
    }
    set((s) => ({ attachments: [...s.attachments, ...newOnes] }));
  },

  removeAttachment: (id) =>
    set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) })),
  clearAttachments: () => set({ attachments: [] }),

  // --- ACTIONS ---
  setPrompt: (prompt) => set({ prompt }),

  toggleProvider: (providerId) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId ? { ...p, selected: !p.selected } : p
      ),
    })),

  updateProviderSettings: (providerId, newSettings) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId
          ? { ...p, settings: { ...p.settings, ...newSettings } }
          : p
      ),
    })),

  sendPromptToApis: async () => {
    const { prompt, providers, attachments, clearAttachments } = get();
    const selectedProviders = providers.filter((p) => p.selected);

    if (!prompt || selectedProviders.length === 0) return;

    // 1. Set initial loading state (same as before)
    const initialResponses: ApiResponse[] = selectedProviders.map((p) => ({
      id: uuidv4(),
      providerId: p.id,
      status: "loading",
      content: "",
      tokenUsage: { prompt: 0, completion: 0 },
      responseTime: 0,
    }));
    set({ responses: initialResponses });

    await Promise.all(
      selectedProviders.map(async (provider) => {
        const payload: any = { provider, prompt };
        if (provider.id === "openai" && attachments.length > 0) {
          // strip ArrayBuffers into plain {name,type,size,data} — ArrayBuffer passes fine over IPC
          payload.attachments = attachments.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            size: a.size,
            data: a.data,
          }));
        }

        const result = await window.electronAPI.invoke("send-prompt", payload);

        set((state) => ({
          responses: state.responses.map((r) =>
            r.providerId === provider.id ? { ...r, ...result } : r
          ),
        }));
      })
    );
  },
}));

export default useAppStore;

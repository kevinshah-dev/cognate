// src/renderer/store.ts
import { create } from "zustand";
import { AppState, ApiProvider, ApiResponse, Attachment } from "./types";
import { v4 as uuidv4 } from "uuid";
import { View } from "./types";

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
      selected: false,
      settings: { model: "gpt-5", max_tokens: 8192 },
    },
    {
      id: "openai-mini-5",
      name: "OpenAI GPT-5 Mini",
      selected: false,
      settings: { model: "gpt-5-mini", max_tokens: 8192 },
    },
    {
      id: "anthropic",
      name: "Claude Opus 4.1",
      selected: false,
      settings: { model: "claude-opus-4-1-20250805", max_tokens: 8192 },
    },
    {
      id: "anthropic-sonnet-4",
      name: "Claude Sonnet 4",
      selected: false,
      settings: { model: "claude-sonnet-4-0", max_tokens: 8192 },
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
    {
      id: "deepseek-reasoner",
      name: "DeepSeek V3.1 Thinking",
      selected: false,
      settings: { model: "deepseek-reasoner", max_tokens: 8192 },
    },
  ],
  responses: [],

  currentView: "compare" as View,
  goTo: (v: View) => set({ currentView: v }),

  promptHistory: [] as {
    id: string;
    text: string;
    createdAt: number;
    providers: string[];
    attachmentNames?: string[];
  }[],
  loadHistory: async () => {
    const list = await window.electronAPI.listHistory?.();
    set({ promptHistory: Array.isArray(list) ? list : [] });
  },
  deleteHistory: async (id: string) => {
    await window.electronAPI.deleteHistory?.(id);
    get().loadHistory();
  },
  clearHistory: async () => {
    await window.electronAPI.clearHistory?.();
    set({ promptHistory: [] });
  },

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

    try {
      await window.electronAPI.addHistory?.({
        text: prompt,
        providers: selectedProviders.map((p) => p.id),
        attachmentNames: attachments.map((a) => a.name),
      });
    } catch {}

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
        if (
          (provider.id === "openai" ||
            provider.id === "anthropic" ||
            provider.id === "google") &&
          attachments.length > 0
        ) {
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

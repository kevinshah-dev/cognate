// src/renderer/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import useAppStore from "./store";
import { ProviderPanel } from "./components/ProviderPanel";
import { PromptInput } from "./components/PromptInput";
import { ResponseGrid } from "./components/ResponseGrid";
import SettingsModal from "./components/SettingsModal"; // NEW
import { AppState } from "./types";
import { useShallow } from "zustand/react/shallow";
import AttachmentsModal from "./components/AttachmentsModal";
import PromptLibrary from "./components/PromptLibrary";

const selector = (state: AppState) => ({
  sendPrompt: state.sendPromptToApis,
});

const App = () => {
  const { sendPrompt } = useAppStore(useShallow(selector));

  const currentView = useAppStore((s) => s.currentView);

  return (
    <main className="bg-dark-bg text-dark-text flex h-screen font-sans">
      <aside
        role="complementary"
        className="w-1/4 max-w-xs min-w-[280px] bg-dark-bg-secondary p-4 border-r border-dark-border"
      >
        <ProviderPanel />
      </aside>

      <section role="main" className="flex-1 flex flex-col h-screen">
        {currentView === "compare" ? (
          <>
            <ResponseGrid />
            <div className="p-4 border-t border-dark-border">
              <PromptInput onSend={sendPrompt} />
            </div>
          </>
        ) : (
          <PromptLibrary />
        )}
      </section>
      <SettingsModal />
      <AttachmentsModal />
    </main>
  );
};

const container = document.getElementById("root");
createRoot(container!).render(<App />);

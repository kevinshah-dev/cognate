// src/renderer/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import useAppStore from './store';
import { ProviderPanel } from './components/ProviderPanel';
import { PromptInput } from './components/PromptInput';
import { ResponseGrid } from './components/ResponseGrid';
import SettingsModal from './components/SettingsModal'; // NEW
import { AppState } from './types';
import { useShallow } from 'zustand/react/shallow';
import AttachmentsModal from './components/AttachmentsModal';

const selector = (state: AppState) => ({
  sendPrompt: state.sendPromptToApis,
});

const App = () => {
  const { sendPrompt } = useAppStore(useShallow(selector));

  return (
    <main className="bg-dark-bg text-dark-text flex h-screen font-sans">
      <aside role="complementary" className="w-1/4 max-w-xs min-w-[280px] bg-dark-bg-secondary p-4 border-r border-dark-border">
        <ProviderPanel />
      </aside>

      <section role="main" className="flex-1 flex flex-col h-screen">
        <ResponseGrid />
        <div className="p-4 border-t border-dark-border">
          <PromptInput onSend={sendPrompt} />
        </div>
      </section>
      <SettingsModal />
      <AttachmentsModal />
    </main>
  );
};

const container = document.getElementById('root');
createRoot(container!).render(<App />);

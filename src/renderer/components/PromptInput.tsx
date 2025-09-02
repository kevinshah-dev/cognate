import React from 'react';
import useAppStore from '../store';
import { SendHorizonal, Plus, X } from 'lucide-react';
import { AppState } from '../types';
import { useShallow } from 'zustand/react/shallow';

interface PromptInputProps {
  onSend: () => void;
}

const selector = (state: AppState) => ({
  prompt: state.prompt,
  setPrompt: state.setPrompt,
  openAttachments: state.openAttachmentModal,
  attachments: state.attachments,
  removeAttachment: state.removeAttachment,
});

export const PromptInput = ({ onSend }: PromptInputProps) => {
  const { prompt, setPrompt, openAttachments, attachments, removeAttachment } = useAppStore(useShallow(selector));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt here... (Ctrl+Enter to send)"
        aria-label="Prompt Input"
        className="w-full bg-dark-card border border-dark-border rounded-lg p-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue text-dark-text"
        rows={3}
      />

      {/* attachment chips */}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map(a => (
            <span key={a.id} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-dark-bg-secondary border border-dark-border">
              {a.name}
              <button
                className="opacity-70 hover:opacity-100"
                onClick={() => removeAttachment(a.id)}
                aria-label={`Remove ${a.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="absolute right-3 top-3 flex items-center space-x-2">
        <button
          aria-label="Add attachment"
          onClick={openAttachments}
          className="p-2 rounded-md hover:bg-dark-border transition-colors"
          title="Attach PDF"
        >
          <Plus size={20} className="text-dark-text-secondary" />
        </button>
        <button
          onClick={onSend}
          aria-label="Send prompt"
          className="bg-accent-blue text-white p-2 rounded-md hover:bg-accent-blue/80 transition-colors flex items-center"
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
};

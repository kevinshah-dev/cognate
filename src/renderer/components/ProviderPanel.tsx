// src/renderer/components/ProviderPanel.tsx
import React from "react";
import useAppStore from "../store";
import { Check, SlidersHorizontal, Info, Settings, Key } from "lucide-react";
import { AppState, ApiProvider } from "../types";
import { useShallow } from "zustand/react/shallow";

const selector = (state: AppState) => ({
  providers: state.providers,
  toggleProvider: state.toggleProvider,
  openSettings: state.openSettings, // Settings Modal
});

export const ProviderPanel = () => {
  const { providers, toggleProvider, openSettings } = useAppStore(
    useShallow(selector)
  );

  const goTo = useAppStore((s) => s.goTo);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-dark-text-secondary">
        Models
      </h2>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onToggle={() => toggleProvider(provider.id)}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => {
            goTo("library");
          }}
          className="w-full inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-dark-border hover:bg-dark-border/40 text-dark-text-secondary"
          aria-label="Open Prompt Library"
        >
          {/* use any icon you like; History or Bookmark */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="opacity-80"
          >
            <path
              fill="currentColor"
              d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7zm-1 4h2v6h-6v-2h4z"
            />
          </svg>
          Prompt Library
        </button>

        <button
          onClick={openSettings}
          className="w-full inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-dark-border hover:bg-dark-border/40 text-dark-text-secondary"
          aria-label="Open Settings"
        >
          <Key size={16} />
          API Keys
        </button>
      </div>
    </div>
  );
};

interface ProviderCardProps {
  provider: ApiProvider;
  onToggle: () => void;
}

const ProviderCard = ({ provider, onToggle }: ProviderCardProps) => {
  const isSelected = provider.selected;

  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && onToggle()}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected ? "bg-accent-blue/20 border-accent-blue" : "bg-dark-card border-dark-border hover:border-dark-border/70"}
      `}
    >
      <div className="flex items-center justify-between">
        <span
          className={`font-medium ${isSelected ? "text-dark-text" : "text-dark-text-secondary"}`}
        >
          {provider.name}
        </span>
        <div
          className={`
          w-5 h-5 rounded-md border flex items-center justify-center
          ${isSelected ? "bg-accent-blue border-accent-blue" : "border-dark-border"}
        `}
        >
          {isSelected && <Check size={16} className="text-white" />}
        </div>
      </div>
      <p className="text-xs text-dark-text-secondary/60 mt-1">
        {provider.settings.model}
      </p>
    </div>
  );
};

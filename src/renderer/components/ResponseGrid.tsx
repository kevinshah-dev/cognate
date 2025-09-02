import React from "react";
import useAppStore from "../store";
import { AppState, ApiResponse } from "../types";
import {
  Loader2,
  AlertTriangle,
  Copy,
  BrainCircuit,
  Maximize2,
  X,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

const selector = (state: AppState) => ({
  responses: state.responses,
  providers: state.providers,
});

export const ResponseGrid = () => {
  const { responses, providers } = useAppStore(useShallow(selector));
  const [active, setActive] = React.useState<{
    response: ApiResponse;
    providerName: string;
  } | null>(null);

  if (responses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-dark-text-secondary p-4">
        <BrainCircuit size={48} className="mb-4 text-dark-border" />
        <h3 className="text-lg font-medium">Responses will appear here</h3>
        <p className="text-sm text-center">
          Select providers from the left panel, type your prompt below, and
          press send.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
        {responses.map((response) => {
          const provider = providers.find((p) => p.id === response.providerId);
          const providerName = provider?.name || "Unknown";
          return (
            <CollapsedResponseCard
              key={response.id}
              response={response}
              providerName={providerName}
              onOpen={() => setActive({ response, providerName })}
            />
          );
        })}
      </div>

      {active && (
        <ResponseModal
          response={active.response}
          providerName={active.providerName}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
};

interface CollapsedCardProps {
  response: ApiResponse;
  providerName: string;
  onOpen: () => void;
}

const CollapsedResponseCard = ({
  response,
  providerName,
  onOpen,
}: CollapsedCardProps) => {
  const renderCollapsed = () => {
    switch (response.status) {
      case "loading":
        return (
          <div className="flex items-center justify-center h-32 text-dark-text-secondary">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span>Generating...</span>
          </div>
        );
      case "error":
        return (
          <div className="text-accent-red">
            <div className="flex items-center font-semibold mb-2">
              <AlertTriangle size={18} className="mr-2" />
              <span>Error</span>
            </div>
            <p className="text-sm line-clamp-3">{response.error}</p>
          </div>
        );
      case "success":
        // Collapsed body: cap height + fade overlay
        return (
          <div className="relative">
            <div className="prose prose-invert prose-sm max-w-none text-dark-text whitespace-pre-wrap max-h-[50vh] overflow-hidden pb-1">
              {response.content}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="bg-dark-card border border-dark-border rounded-lg flex flex-col hover:border-accent-blue/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-blue"
    >
      <div className="flex justify-between items-center p-3 border-b border-dark-border">
        <h4 className="font-semibold text-dark-text-secondary">
          {providerName}
        </h4>
        <div className="flex items-center space-x-3">
          {response.status === "success" && (
            <span className="text-xs text-dark-text-secondary/70">
              {response.responseTime.toFixed(0)}ms
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(response.content);
            }}
            aria-label="Copy response"
            className="text-dark-text-secondary hover:text-accent-blue transition-colors"
            title="Copy"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-label="Expand"
            className="text-dark-text-secondary hover:text-accent-blue transition-colors"
            title="Expand"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-4">{renderCollapsed()}</div>
    </div>
  );
};

interface ModalProps {
  response: ApiResponse;
  providerName: string;
  onClose: () => void;
}

const ResponseModal = ({ response, providerName, onClose }: ModalProps) => {
  const renderFull = () => {
    switch (response.status) {
      case "loading":
        return (
          <div className="flex items-center justify-center h-40 text-dark-text-secondary">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span>Generating...</span>
          </div>
        );
      case "error":
        return (
          <div className="text-accent-red">
            <div className="flex items-center font-semibold mb-2">
              <AlertTriangle size={18} className="mr-2" />
              <span>Error</span>
            </div>
            <p className="text-sm">{response.error}</p>
          </div>
        );
      case "success":
        return (
          <div className="prose prose-invert prose-sm max-w-none text-dark-text whitespace-pre-wrap">
            {response.content}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-4xl max-h-[85vh] bg-dark-card border border-dark-border rounded-2xl shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-3 border-b border-dark-border">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-dark-text-secondary">
                {providerName}
              </h4>
              {response.status === "success" && (
                <span className="text-xs text-dark-text-secondary/70">
                  {response.responseTime.toFixed(0)}ms
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(response.content)}
                aria-label="Copy response"
                className="text-dark-text-secondary hover:text-accent-blue transition-colors"
                title="Copy"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-dark-text-secondary hover:text-dark-text transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-4 overflow-y-auto">{renderFull()}</div>
        </div>
      </div>
    </div>
  );
};

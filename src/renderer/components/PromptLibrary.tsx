import React from "react";
import useAppStore from "../store";
import { X, Trash2, RotateCcw, ArrowUpLeft } from "lucide-react";

export default function PromptLibrary() {
  const promptHistory = useAppStore((s) => s.promptHistory);
  const loadHistory = useAppStore((s) => s.loadHistory);
  const deleteHistory = useAppStore((s) => s.deleteHistory);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const setPrompt = useAppStore((s) => s.setPrompt);
  const goTo = useAppStore((s) => s.goTo);

  React.useEffect(() => {
    loadHistory();
  }, []);
  return (
    <section className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goTo("compare")}
            className="px-2 py-1 rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
            title="Back"
          >
            <ArrowUpLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-dark-text-secondary">
            Prompt Library
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 text-sm rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
            title="Clear all"
          >
            <RotateCcw size={14} className="inline mr-1" /> Clear All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {promptHistory.length === 0 ? (
          <p className="text-sm text-dark-text-secondary/70">No prompts yet.</p>
        ) : (
          promptHistory.map((p) => (
            <div
              key={p.id}
              className="bg-dark-card border border-dark-border rounded-lg p-3 hover:border-accent-blue/40 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="text-xs text-dark-text-secondary/60 mb-1">
                    {new Date(p.createdAt).toLocaleString()} ·{" "}
                    {p.providers.join(", ")}
                    {p.attachmentNames?.length
                      ? ` · ${p.attachmentNames.length} file(s)`
                      : ""}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-dark-text">
                    {p.text}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrompt(p.text);
                      goTo("compare");
                    }}
                    className="px-2 py-1 rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
                    title="Use this prompt"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => deleteHistory(p.id)}
                    className="p-1 rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

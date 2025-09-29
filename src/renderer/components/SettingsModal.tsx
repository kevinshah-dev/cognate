// src/renderer/components/SettingsModal.tsx
import React from "react";
import { X, KeyRound, Eye, EyeOff, Save } from "lucide-react";
import useAppStore from "../store";
import { AppState } from "../types";
import { useShallow } from "zustand/react/shallow";

// --- Hoisted input row component (stable identity) ---
type FieldKey = "openai" | "anthropic" | "google" | "deepseek";

interface InputRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}

const InputRow = React.memo(function InputRow({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: InputRowProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm mb-1 text-dark-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-dark-bg-secondary border border-dark-border rounded-lg py-2 px-3 pr-10 text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-blue"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          aria-label={show ? "Hide API key" : "Show API key"}
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-text-secondary hover:text-dark-text"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
});

// --- Modal ---
const selector = (s: AppState) => ({
  open: s.settingsOpen,
  close: s.closeSettings,
});

export default function SettingsModal() {
  const { open, close } = useAppStore(useShallow(selector));
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [openai, setOpenai] = React.useState("");
  const [anthropic, setAnthropic] = React.useState("");
  const [google, setGoogle] = React.useState("");
  const [deepseek, setDeepseek] = React.useState("");

  const [show, setShow] = React.useState<Record<FieldKey, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    deepseek: false,
  });

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSaved(false);
    window.electronAPI
      .getApiKeys()
      .then((keys) => {
        setOpenai(keys.openai || "");
        setAnthropic(keys.anthropic || "");
        setGoogle(keys.google || "");
        setDeepseek(keys.deepseek || "");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const onSave = async () => {
    setLoading(true);
    setSaved(false);
    console.log("onSave", openai, anthropic, google, deepseek);
    try {
      await window.electronAPI.setApiKeys({
        openai: openai?.trim() || "",
        anthropic: anthropic?.trim() || "",
        google: google?.trim() || "",
        deepseek: deepseek?.trim() || "",
      });
      setSaved(true);
      setTimeout(() => close(), 600);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-xl"
          onClick={
            (e) =>
              e.stopPropagation() /* prevent backdrop close when clicking inside */
          }
        >
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <KeyRound size={18} className="text-accent-blue" />
              <h3 className="text-md font-semibold text-dark-text">API Keys</h3>
            </div>
            <button
              className="p-2 rounded-md text-dark-text-secondary hover:text-dark-text"
              onClick={close}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            {/* If you switched to keytar, update this copy */}
            <p className="text-xs text-dark-text-secondary mb-4">
              Keys are stored securely on your device and only sent to the
              selected provider when you make a request.
            </p>

            <InputRow
              label="OpenAI API Key"
              value={openai}
              onChange={setOpenai}
              show={show.openai}
              onToggleShow={() => setShow((s) => ({ ...s, openai: !s.openai }))}
              placeholder="sk-..."
            />
            <InputRow
              label="Anthropic API Key"
              value={anthropic}
              onChange={setAnthropic}
              show={show.anthropic}
              onToggleShow={() =>
                setShow((s) => ({ ...s, anthropic: !s.anthropic }))
              }
              placeholder="sk-ant-..."
            />
            <InputRow
              label="Google (Gemini) API Key"
              value={google}
              onChange={setGoogle}
              show={show.google}
              onToggleShow={() => setShow((s) => ({ ...s, google: !s.google }))}
              placeholder="AIza..."
            />
            <InputRow
              label="DeepSeek API Key"
              value={deepseek}
              onChange={setDeepseek}
              show={show.deepseek}
              onToggleShow={() =>
                setShow((s) => ({ ...s, deepseek: !s.deepseek }))
              }
              placeholder="sk-..."
            />

            {saved && (
              <div className="mt-2 text-xs text-emerald-400">✓ Saved</div>
            )}
          </div>

          <div className="p-4 border-t border-dark-border flex justify-end gap-2">
            <button
              onClick={close}
              className="px-3 py-2 text-sm rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-3 py-2 text-sm rounded-md bg-accent-blue text-white hover:bg-accent-blue/80 inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

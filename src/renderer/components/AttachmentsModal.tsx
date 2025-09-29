import React from "react";
import { X, Upload, Trash2, Paperclip } from "lucide-react";
import useAppStore from "../store";
import { AppState } from "../types";
import { useShallow } from "zustand/react/shallow";

const selector = (s: AppState) => ({
  open: s.attachmentModalOpen,
  close: s.closeAttachmentModal,
  add: s.addAttachments,
  remove: s.removeAttachment,
  attachments: s.attachments,
});

export default function AttachmentsModal() {
  const { open, close, add, remove, attachments } = useAppStore(
    useShallow(selector)
  );

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) await add(files);
    // reset input so selecting same file twice still fires change
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) await add(files);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl bg-dark-card border border-dark-border rounded-2xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <div className="flex items-center gap-2">
              <Paperclip size={18} className="text-accent-blue" />
              <h3 className="text-md font-semibold text-dark-text">
                Attach PDFs
              </h3>
            </div>
            <button
              className="p-2 rounded-md text-dark-text-secondary hover:text-dark-text"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <label
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="block border-2 border-dashed border-dark-border/70 rounded-xl p-6 text-center cursor-pointer hover:border-accent-blue/60 transition-colors"
            >
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={onPick}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2 text-dark-text-secondary">
                <Upload size={22} />
                <p className="text-sm">
                  Drag & drop PDF files here, or click to browse
                </p>
                <p className="text-xs opacity-70">
                  Only PDF files are accepted
                </p>
              </div>
            </label>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm bg-dark-bg-secondary border border-dark-border rounded-lg px-3 py-2"
                  >
                    <span className="truncate">{a.name}</span>
                    <button
                      className="text-dark-text-secondary hover:text-accent-red"
                      onClick={() => remove(a.id)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-dark-border flex justify-end">
            <button
              onClick={close}
              className="px-3 py-2 text-sm rounded-md border border-dark-border text-dark-text-secondary hover:bg-dark-border/40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

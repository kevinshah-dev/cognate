// src/main/api/adapters/anthropic.ts
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { ApiProvider, ApiResponse, Attachment } from "../../../renderer/types";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const FILES_BETA = ["files-api-2025-04-14"]; // required for Files API

export async function callAnthropic(
  provider: ApiProvider,
  prompt: string,
  apiKey: string,
  attachments?: Attachment[]
): Promise<Partial<ApiResponse>> {
  const client = new Anthropic({ apiKey });

  const startTime = Date.now();
  const tempPaths: string[] = [];
  const fileIds: string[] = [];

  try {
    // 1) Upload PDFs (if any) via Files API beta
    if (attachments?.length) {
      for (const a of attachments) {
        const isPdf =
          a.type === "application/pdf" || a.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) continue;

        const tmp = path.join(
          os.tmpdir(),
          `cognate-${Date.now()}-${Math.random().toString(36).slice(2)}-${a.name}`
        );
        tempPaths.push(tmp);

        // ArrayBuffer -> Buffer -> write temp file
        await writeFile(tmp, Buffer.from(a.data));

        // Upload to Anthropic Files API
        const uploaded = await client.beta.files.upload(
          {
            file: await toFile(fs.createReadStream(tmp), a.name, {
              type: "application/pdf",
            }),
          },
          { betas: FILES_BETA }
        );

        fileIds.push(uploaded.id);
      }
    }

    // 2) Create the message
    let msg;

    if (fileIds.length > 0) {
      // Use beta.messages with document blocks for PDFs
      msg = await client.beta.messages.create({
        model: provider.settings.model || "claude-opus-4-1-20250805",
        max_tokens: provider.settings.max_tokens,
        betas: FILES_BETA,
        messages: [
          {
            role: "user",
            content: [
              // one 'document' block per uploaded PDF
              ...fileIds.map((id) => ({
                type: "document" as const,
                source: { type: "file" as const, file_id: id },
              })),
              // your instruction/prompt
              {
                type: "text" as const,
                text: prompt || "Analyze the attached PDFs.",
              },
            ],
          },
        ],
      });
    } else {
      // No files attached → standard text-only request
      msg = await client.messages.create({
        model: provider.settings.model || "claude-opus-4-1-20250805",
        max_tokens: provider.settings.max_tokens,
        messages: [{ role: "user", content: prompt }],
      });
    }

    const text = Array.isArray(msg.content)
      ? msg.content
          .filter((c: any) => c?.type === "text" && typeof c.text === "string")
          .map((c: any) => c.text)
          .join("\n")
      : "";

    const endTime = Date.now();

    // 4) Cleanup temp files (best-effort)
    for (const p of tempPaths) unlink(p).catch(() => {});

    return {
      status: "success",
      content: text,
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: msg.usage?.input_tokens ?? 0,
        completion: msg.usage?.output_tokens ?? 0,
      },
    };
  } catch (err: any) {
    // Cleanup on error too
    for (const p of tempPaths) unlink(p).catch(() => {});
    const message =
      err?.error?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      "An unexpected error occurred.";
    console.error("Anthropic SDK Error:", message);
    return { status: "error", error: message, responseTime: 0 };
  }
}

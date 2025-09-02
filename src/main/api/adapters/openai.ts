// src/main/api/adapters/openai.ts
import OpenAI from "openai";
import { ApiProvider, ApiResponse } from "../../../renderer/types";
import { Attachment } from "../../../renderer/types";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export async function callOpenAI(
  provider: ApiProvider,
  prompt: string,
  apiKey: string,
  attachments?: Attachment[]
): Promise<Partial<ApiResponse>> {
  const client = new OpenAI({ apiKey });

  try {
    const startTime = Date.now();
    let fileIds: string[] = [];
    const tempPaths: string[] = [];

    if (attachments && attachments.length > 0) {
      for (const a of attachments) {
        if (
          a.type !== "application/pdf" &&
          !a.name.toLowerCase().endsWith(".pdf")
        )
          continue;

        const tmp = path.join(
          os.tmpdir(),
          `cognate-${Date.now()}-${Math.random().toString(36).slice(2)}-${a.name}`
        );
        tempPaths.push(tmp);

        const buf = Buffer.from(a.data); // ArrayBuffer -> Buffer
        await writeFile(tmp, buf);

        const created = await client.files.create({
          file: fs.createReadStream(tmp),
          purpose: "user_data",
        });

        fileIds.push(created.id);
      }
    }

    let response;

    if (fileIds.length > 0) {
      response = await client.responses.create({
        model: provider.settings.model,
        max_output_tokens: provider.settings.max_tokens,
        input: [
          {
            role: "user",
            content: [
              ...fileIds.map((id) => ({
                type: "input_file" as const,
                file_id: id,
              })),
              {
                type: "input_text" as const,
                text: prompt || "Analyze the attached PDFs.",
              },
            ],
          },
        ],
      });
    } else {
      response = await client.responses.create({
        model: provider.settings.model,
        max_output_tokens: provider.settings.max_tokens,
        input: prompt,
      });
    }

    const endTime = Date.now();

    for (const p of tempPaths) {
      unlink(p).catch(() => {});
    }

    return {
      status: "success",
      content: response.output_text ?? "", // combined text output
      responseTime: endTime - startTime,
      tokenUsage: {
        prompt: response.usage?.input_tokens ?? 0,
        completion: response.usage?.output_tokens ?? 0,
      },
    };
  } catch (err: any) {
    const msg =
      err?.error?.message || err?.message || "An unexpected error occurred.";
    console.error("OpenAI SDK Error:", msg);
    return { status: "error", error: msg, responseTime: 0 };
  }
}

# Cognate
_Side-by-side AI provider comparison_

Cognate is a desktop app for comparing responses from multiple AI providers in one place. It’s built with Electron Forge + Webpack, React + Tailwind, and a small set of main-process adapters for OpenAI, Anthropic (Claude), Google Gemini, and DeepSeek.

It includes secure API-key storage (Keytar on macOS Keychain / Windows Credential Manager), a clean prompts UI, a collapsible response grid, and an attachments flow that lets you drop PDFs and send them with your prompt to OpenAI (via the Files + Responses APIs).

## ✨ Features

- **Multi-provider:** OpenAI, Anthropic (Claude), Google Gemini, DeepSeek  
- **One prompt → many models:** fire requests concurrently and compare outputs  
- **Collapsible response cards** with a fullscreen modal for readability  
- **Secure API Keys** with Keytar (stored in the OS credential vault)  
- **Attachments (PDF):** drag & drop PDFs and include them in OpenAI requests (uploads via Files API; used as `input_file` alongside your `input_text`)  
- **IPC bridge:** renderer stays sandboxed; requests happen in the main process  
- **Dark, minimal UI** built with Tailwind

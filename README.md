# Telegram Poster — VS Code Extension

Send selected code (or the whole file) from VS Code directly to a Telegram chat or channel via a bot. Perfect for quickly sharing snippets to teams, study groups, or your personal notes.

## Features

- **Send selection or entire file**: If you have a selection, it sends that; otherwise it sends the whole document.
- **Code-fenced messages** with the current file’s language ID for nicer rendering in Telegram.
- Optional **filename header** and **metadata line** (language + timestamp).
- **MarkdownV2 / HTML / None** parse modes. Defaults to MarkdownV2.
- **Chunking** for long messages (default 3500 chars, adjustable) to stay under Telegram limits.
- **Secure token storage** using VS Code secrets.

## Requirements

- **VS Code** ≥ 1.84.0.
- A **Telegram Bot Token** (from [@BotFather]) and a **chat ID** (user, group, or channel). The extension stores your bot token in the VS Code **Secrets** vault. 

## Installation

### From Source (Recommended for development)
1. Clone the repository: `git clone https://github.com/Voivodi/Extension`. 
2. Open the folder in VS Code.  
3. Press **F5** to run the extension in a new Extension Development Host window.


## Getting Started

1. **Set your bot token (secure)**
   - Run **Command Palette → “Telegram: Set Bot Token (secure)”**.
   - The token is stored via `context.secrets`.

2. **Configure your chat**
   - Open **Settings → Extensions → Telegram Poster** and set:
     - `telegramPoster.chatId` — e.g., `1330472266` or `@your_channel`.
     - (Optional) `telegramPoster.parseMode` — `MarkdownV2` (default), `HTML`, or `None`.
     - (Optional) `telegramPoster.prependFilename` — show file name above the snippet.
     - (Optional) `telegramPoster.includeMetadata` — show language + timestamp.
     - (Optional) `telegramPoster.chunkSize` — default `3500` (1000–4000 allowed).

3. **Send a snippet**
   - Select some text in an open editor and run **“Telegram: Send Selection”**.  
   - If nothing is selected, the entire document is sent.

## How it Works

- The extension builds a message as:
  1) Optional header (filename and/or metadata),  
  2) A **code fence** with the current document’s language ID and the selected text.
- For **MarkdownV2**, special characters in the header are escaped to prevent formatting issues. (The code block itself is sent as a fenced block.) {index=18}  
- Long messages are **split into chunks** using your `chunkSize` setting and sent sequentially (with a short delay between parts).
- Messages are sent via Telegram’s `sendMessage` API with `disable_web_page_preview: true`.

## Commands

- **Telegram: Send Selection** — `telegramPoster.sendSelection`
- **Telegram: Set Bot Token (secure)** — `telegramPoster.setBotToken` 
- **Telegram: Clear Stored Bot Token** — `telegramPoster.clearBotToken`

You can access them from the Command Palette or bind your own keybindings.

## Settings

| Setting                              | Type      | Default      | Description |
|--------------------------------------|-----------|--------------|-------------|
| `telegramPoster.chatId`              | string    | `""`         | Chat ID or channel username (e.g., `@your_channel`). |
| `telegramPoster.parseMode`           | enum      | `MarkdownV2` | Telegram parse mode: `MarkdownV2`, `HTML`, or `None`.|
| `telegramPoster.prependFilename`     | boolean   | `true`       | Prepend the file name as a header above the snippet. |
| `telegramPoster.includeMetadata`     | boolean   | `false`      | Include language + timestamp line.|
| `telegramPoster.chunkSize`           | integer   | `3500`       | Max chars per chunk (1000–4000). Helps avoid Telegram limits. |

## Troubleshooting

- **“chatId is empty”**: Set it in **Settings → Extensions → Telegram Poster**.
- **“Bot token not set”**: Run **“Telegram: Set Bot Token (secure)”**.
- **“Nothing to send: selection is empty.”**: Select text or ensure the file has contents.
- **Telegram API errors (e.g., 400/403)**: Check that the bot is permitted to post to the target chat/channel, and verify `chatId`/token. Errors from the HTTP response are surfaced in the notification. 
- **Broken formatting with MarkdownV2**: Try switching `parseMode` to `HTML` or `None` in settings. 

## Notes & Limitations

- Telegram’s hard limit per message is **4096 characters**; this extension chunks your message according to `chunkSize` (default `3500`) and sends multiple messages if needed.
- This extension uses **`sendMessage`** (text only). It does not currently upload files or media.
- Header lines are escaped for MarkdownV2; the fenced code block content is sent as-is inside triple backticks with a language hint.

## Security & Privacy

- Your **bot token** is stored securely via VS Code’s Secrets API and can be cleared at any time with **“Telegram: Clear Stored Bot Token.”**  
- The extension sends your selected text and optional metadata to Telegram’s servers via HTTPS.

## Repository

Git: https://github.com/Voivodi/Extension 
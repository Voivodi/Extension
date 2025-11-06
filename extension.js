
const vscode = require('vscode');

function escapeMarkdownV2Inline(s) {
  return s.replace(/[\\_\*~`>#+\-=|{}.!]/g, match => `\\${match}`);
}

async function sendToTelegram({ token, chatId, text, parseMode }) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    ...(parseMode && parseMode !== 'None' ? { parse_mode: parseMode } : {}),
    disable_web_page_preview: true
  };

  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${msg}`);
  }

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API responded not ok: ${JSON.stringify(data)}`);
  }
}

function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

async function buildAndSendMessages(context) {
  const cfg = vscode.workspace.getConfiguration('telegramPoster');
  let chatId = cfg.get('chatId');
  const parseMode = cfg.get('parseMode');
  const prependFilename = cfg.get('prependFilename');
  const includeMetadata = cfg.get('includeMetadata');
  const chunkSize = cfg.get('chunkSize');

  if (!chatId || chatId.trim() === '') {
    vscode.window.showErrorMessage('Telegram: chatId is empty. Set it in Settings → Extensions → Telegram Poster.');
    return;
  }

  const token = await context.secrets.get('telegramPoster.botToken');
  if (!token) {
    const setNow = 'Set Bot Token';
    const choice = await vscode.window.showWarningMessage('Telegram bot token not set. You must set it before sending.', setNow);
    if (choice === setNow) {
      await setBotToken(context);
    }
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('Open a file and select some text to send.');
    return;
  }

  const doc = editor.document;
  const selection = editor.selection;
  let selectedText = selection && !selection.isEmpty ? doc.getText(selection) : doc.getText();
  if (!selectedText || selectedText.trim() === '') {
    vscode.window.showInformationMessage('Nothing to send: selection is empty.');
    return;
  }

  const language = doc.languageId || '';
  const fileName = doc.fileName ? doc.fileName.split(/\\|\//).pop() : 'untitled';

  const headerLines = [];
  if (prependFilename) headerLines.push(fileName);
  if (includeMetadata) headerLines.push(`${language || 'text'} • ${new Date().toLocaleString()}`);

  const header = headerLines.length
    ? (parseMode === 'MarkdownV2' ? `${escapeMarkdownV2Inline(headerLines.join('\n'))}\n\n` : headerLines.join('\n') + '\n\n')
    : '';

  
  const fenced = `\u0060\u0060\u0060${language || ''}\n${selectedText}\n\u0060\u0060\u0060`;
  const messageText = header + fenced;

  
  const chunks = chunkString(messageText, Math.min(Math.max(chunkSize, 1000), 4000));

  const sending = vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Sending to Telegram…', cancellable: false },
    async () => {
      for (const [i, chunk] of chunks.entries()) {
        await sendToTelegram({ token, chatId, text: chunk, parseMode });
        if (chunks.length > 1) {
          
          await new Promise(r => setTimeout(r, 150));
        }
      }
    }
  );
  try {
    await sending;
    vscode.window.showInformationMessage(`Sent ${chunks.length} message${chunks.length > 1 ?  's': ''} to Telegram.`);
  } catch (err) {
    vscode.window.showErrorMessage('Telegram send failed: ${err.message}');
  }
}

async function setBotToken(context) {
  const token = await vscode.window.showInputBox({
    title: 'Enter Telegram Bot Token',
    prompt: 'Looks like 123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    ignoreFocusOut: true,
    password: true
  });
  if (!token) return; 
  await context.secrets.store('telegramPoster.botToken', token.trim());
  vscode.window.showInformationMessage('Telegram bot token saved securely.');
}

async function clearBotToken(context) {
  await context.secrets.delete('telegramPoster.botToken');
  vscode.window.showInformationMessage('Telegram bot token cleared.');
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('telegramPoster.sendSelection', () => buildAndSendMessages(context)),
    vscode.commands.registerCommand('telegramPoster.setBotToken', () => setBotToken(context)),
    vscode.commands.registerCommand('telegramPoster.clearBotToken', () => clearBotToken(context))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
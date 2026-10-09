// What the runner remembers on this machine (state.json in the state folder): its own id, and one
// conversation per task - which engine and profile, the agent's session / thread id, and the work folder.
// Nothing here goes to the cloud.

import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_CONVERSATIONS = 500;

export function conversationKey(projectKey, taskId) {
  return `${projectKey}::${taskId}`;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Writes a file through a temporary copy, so a crash never leaves half a file. */
export async function writeFileAtomic(file, text, { mode } = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, text, { encoding: 'utf8', mode });
  await rename(temporary, file);
}

export function loadLocalState(file) {
  const raw = readJson(file);
  const runnerId = typeof raw?.runnerId === 'string' && /^[0-9a-f-]{36}$/i.test(raw.runnerId) ? raw.runnerId : randomUUID();
  const conversations = raw?.conversations && typeof raw.conversations === 'object' ? { ...raw.conversations } : {};
  let saving = Promise.resolve();

  const save = () => {
    // Keep the most recently used conversations only.
    const keys = Object.keys(conversations);
    if (keys.length > MAX_CONVERSATIONS) {
      keys.sort((a, b) => (conversations[a].lastUsedAt ?? 0) - (conversations[b].lastUsedAt ?? 0))
        .slice(0, keys.length - MAX_CONVERSATIONS)
        .forEach(key => delete conversations[key]);
    }
    const text = JSON.stringify({ runnerId, conversations }, null, 2);
    saving = saving.then(() => writeFileAtomic(file, text), () => writeFileAtomic(file, text));
    return saving;
  };

  return {
    runnerId,
    getConversation: key => conversations[key] ?? null,
    setConversation(key, value) {
      conversations[key] = value;
      return save();
    },
    save,
  };
}

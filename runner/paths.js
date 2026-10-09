// Path helpers of the runner. The path module is injectable so the tests can check Windows and POSIX rules on any OS.

import path from 'node:path';
import os from 'node:os';

const APP_FOLDER = 'task-manager-runner';

/** Whether child is root itself or inside it. Case-insensitive on Windows, where C:\Work and c:\work are the same folder. */
export function isPathInside(child, root, pathModule = path) {
  const normalize = value => {
    const resolved = pathModule.resolve(value).replace(/[\\/]+$/, '');
    return pathModule === path.win32 || (pathModule === path && process.platform === 'win32') ? resolved.toLowerCase() : resolved;
  };
  const normalizedChild = normalize(child);
  const normalizedRoot = normalize(root);
  return normalizedChild === normalizedRoot || normalizedChild.startsWith(`${normalizedRoot}${pathModule.sep}`);
}

/** Where the runner keeps its sign-in, state and logs: %LOCALAPPDATA%\task-manager-runner on Windows, ~/.task-manager-runner elsewhere. */
export function defaultStateDir({ env = process.env, platform = process.platform, homeDir = os.homedir() } = {}) {
  if (platform === 'win32' && env.LOCALAPPDATA) return path.win32.join(env.LOCALAPPDATA, APP_FOLDER);
  return path.join(homeDir, `.${APP_FOLDER}`);
}

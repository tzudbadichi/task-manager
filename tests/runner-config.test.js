import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseSiteConfig, validateConfig } from '../runner/config.js';
import { defaultStateDir, isPathInside } from '../runner/paths.js';

// Windows paths, checked with Windows rules on any OS.
const options = { pathModule: path.win32, env: { LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' }, platform: 'win32', homeDir: 'C:\\Users\\me' };

function baseConfig(overrides = {}) {
  return {
    runnerName: 'Work PC',
    profiles: {
      work: { label: 'עבודה', engine: 'claude', allowedRoots: ['C:\\Projects\\portal', 'C:\\Projects\\crm'] },
      personal: { label: 'אישי', engine: 'codex', codexHome: 'C:\\Users\\me\\.codex-personal', allowedRoots: ['C:\\Projects\\task-manager'], cloudReport: 'full' },
    },
    projects: [
      { key: 'portal', name: 'Portal', profile: 'work', path: 'C:\\Projects\\portal' },
      { key: 'task-manager', profile: 'personal', path: 'c:\\projects\\task-manager' },
    ],
    ...overrides,
  };
}

describe('isPathInside', () => {
  test('Windows: case-insensitive, and a sibling with the same prefix is not inside', () => {
    assert.equal(isPathInside('C:\\Projects\\Portal\\src', 'c:\\projects\\portal', path.win32), true);
    assert.equal(isPathInside('C:\\Projects\\portal', 'C:\\Projects\\portal\\', path.win32), true);
    assert.equal(isPathInside('C:\\Projects\\portal-old', 'C:\\Projects\\portal', path.win32), false);
    assert.equal(isPathInside('C:\\Projects\\portal\\..\\crm', 'C:\\Projects\\portal', path.win32), false);
  });

  test('POSIX: case-sensitive', () => {
    assert.equal(isPathInside('/home/me/work/app', '/home/me/work', path.posix), true);
    assert.equal(isPathInside('/home/me/Work/app', '/home/me/work', path.posix), false);
  });

  test('defaultStateDir uses LOCALAPPDATA on Windows and the home folder elsewhere', () => {
    assert.equal(defaultStateDir({ env: { LOCALAPPDATA: 'C:\\L' }, platform: 'win32', homeDir: 'C:\\H' }), 'C:\\L\\task-manager-runner');
    assert.equal(defaultStateDir({ env: {}, platform: 'linux', homeDir: '/home/me' }), path.join('/home/me', '.task-manager-runner'));
  });
});

describe('validateConfig', () => {
  test('a good config gets its defaults', () => {
    const { config, errors } = validateConfig(baseConfig(), options);
    assert.deepEqual(errors, []);
    assert.equal(config.maxParallelJobs, 2);
    assert.equal(config.jobTimeoutMinutes, 60);
    assert.equal(config.stateDir, 'C:\\Users\\me\\AppData\\Local\\task-manager-runner');
    const { work, personal } = config.profiles;
    assert.equal(work.cloudReport, 'minimal', 'work answers are minimal by default');
    assert.equal(work.permissionMode, 'acceptEdits');
    assert.deepEqual(work.disallowedTools, ['Bash(git push *)']);
    assert.equal(work.command, 'claude');
    assert.equal(work.worktreesDir, 'C:\\Users\\me\\AppData\\Local\\task-manager-runner\\worktrees\\work');
    assert.equal(personal.sandbox, 'workspace-write');
    assert.equal(personal.codexHome, 'C:\\Users\\me\\.codex-personal');
    assert.deepEqual(config.projects.map(project => [project.key, project.profile, project.isolation]), [
      ['portal', 'work', 'worktree'], ['task-manager', 'personal', 'worktree'],
    ]);
    assert.equal(config.projects[1].name, 'task-manager');
  });

  test('the separation: overlapping folders of two profiles are refused', () => {
    const raw = baseConfig();
    raw.profiles.personal.allowedRoots = ['C:\\Projects'];
    const { config, errors } = validateConfig(raw, options);
    assert.equal(config, null);
    assert.ok(errors.some(error => error.includes('share folders')), errors.join('\n'));
  });

  test('the separation: a work project cannot be assigned to the personal profile', () => {
    const raw = baseConfig();
    raw.projects.push({ key: 'crm', profile: 'personal', path: 'C:\\Projects\\crm' });
    const { errors } = validateConfig(raw, options);
    assert.ok(errors.some(error => error.includes('Project "crm"') && error.includes('not inside the allowedRoots of profile "personal"')), errors.join('\n'));
  });

  test('the separation: a profile\'s work folders may not sit inside another profile\'s folders', () => {
    const raw = baseConfig();
    raw.profiles.personal.worktreesDir = 'C:\\Projects\\portal\\agent-folders';
    const { errors } = validateConfig(raw, options);
    assert.ok(errors.some(error => error.includes('worktreesDir is inside the folders of profile "work"')), errors.join('\n'));
  });

  test('the separation: two profiles of the same engine need their own, different account folders', () => {
    const raw = baseConfig();
    raw.profiles.personal = { ...raw.profiles.personal, engine: 'claude', claudeConfigDir: 'C:\\Users\\me\\.claude-personal' };
    delete raw.profiles.personal.codexHome;
    const withDefault = validateConfig(raw, options);
    assert.ok(withDefault.errors.some(error => error.includes('both use claude')), withDefault.errors.join('\n'));

    raw.profiles.work.claudeConfigDir = 'c:\\users\\me\\.claude-personal';
    assert.ok(validateConfig(raw, options).errors.some(error => error.includes('both use claude')));

    raw.profiles.work.claudeConfigDir = 'C:\\Users\\me\\.claude-work';
    assert.deepEqual(validateConfig(raw, options).errors, []);
  });

  test('unsafe agent settings are refused', () => {
    const raw = baseConfig();
    raw.profiles.work.permissionMode = 'bypassPermissions';
    raw.profiles.work.allowedTools = ['Bash(echo "%PATH%")'];
    raw.profiles.personal.sandbox = 'danger-full-access';
    const { errors } = validateConfig(raw, options);
    assert.ok(errors.some(error => error.includes('bypassPermissions is not allowed')));
    assert.ok(errors.some(error => error.includes('allowedTools')));
    assert.ok(errors.some(error => error.includes('danger-full-access is not allowed')));
  });

  test('reports every structural problem', () => {
    const { errors } = validateConfig({
      maxParallelJobs: 99,
      profiles: { 'Bad Name': { engine: 'claude', allowedRoots: ['C:\\x'] }, other: { engine: 'gpt', allowedRoots: ['relative'] } },
      projects: [{ key: 'Bad Key', profile: 'other', path: 'C:\\x' }, { key: 'dup', profile: 'missing', path: 'C:\\x' }],
    }, options);
    for (const expected of ['maxParallelJobs', 'Profile name "Bad Name"', 'engine must be one of', 'allowedRoots must list', 'key must be', 'profile "missing" is not defined']) {
      assert.ok(errors.some(error => error.includes(expected)), `missing error about ${expected}:\n${errors.join('\n')}`);
    }
    assert.deepEqual(validateConfig(null, options).errors, ['The config file must contain a JSON object']);
  });

  test('duplicate project keys are refused', () => {
    const raw = baseConfig();
    raw.projects.push({ key: 'portal', profile: 'work', path: 'C:\\Projects\\crm' });
    assert.ok(validateConfig(raw, options).errors.some(error => error.includes('"portal" is used twice')));
  });
});

describe('parseSiteConfig', () => {
  test('reads the two values of src/config.js', () => {
    const text = "export const SUPABASE_URL = 'https://abc.supabase.co/';\nexport const SUPABASE_ANON_KEY = \"public-key\";\n";
    assert.deepEqual(parseSiteConfig(text), { url: 'https://abc.supabase.co', key: 'public-key' });
    assert.deepEqual(parseSiteConfig("export const SUPABASE_URL = '';"), { url: '', key: '' });
  });
});

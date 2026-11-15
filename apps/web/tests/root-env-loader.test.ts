import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];
const loaderUrl = pathToFileURL(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/with-root-env.mjs'),
).href;

function createWorkspace(): { rootDirectory: string; webDirectory: string } {
  const rootDirectory = mkdtempSync(path.join(os.tmpdir(), 'dalashift-env-test-'));
  temporaryDirectories.push(rootDirectory);
  const webDirectory = path.join(rootDirectory, 'apps', 'web');
  mkdirSync(webDirectory, { recursive: true });
  return { rootDirectory, webDirectory };
}

function loadEnvironment(
  rootDirectory: string,
  webDirectory: string,
  environment: NodeJS.ProcessEnv,
): Record<string, string | null> {
  const script = `
    import { spawnSync } from 'node:child_process';
    import { prepareWebEnvironment } from ${JSON.stringify(loaderUrl)};
    const root = ${JSON.stringify(rootDirectory)};
    const web = ${JSON.stringify(webDirectory)};
    prepareWebEnvironment(root, true);
    const nextLoader = \`
      import { createRequire } from 'node:module';
      const { loadEnvConfig } = createRequire(${JSON.stringify(path.join(webDirectory, 'package.json'))})('@next/env');
      loadEnvConfig(\${JSON.stringify(web)}, true);
      const keys = [
        'DALASHIFT_ENV_ROOT_VALUE',
        'DALASHIFT_ENV_APP_VALUE',
        'DALASHIFT_ENV_DEPLOYMENT_VALUE',
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_DB_PASSWORD'
      ];
      console.log(JSON.stringify(Object.fromEntries(keys.map((key) => [key, process.env[key] ?? null]))));
    \`;
    const nextProcess = spawnSync(process.execPath, ['--input-type=module', '-e', nextLoader], {
      cwd: web,
      env: process.env,
      encoding: 'utf8'
    });
    if (nextProcess.status !== 0) throw new Error(nextProcess.stderr);
    console.log(nextProcess.stdout.trim());
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: webDirectory,
    env: { ...environment, NODE_ENV: 'development' },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `Environment loader exited with ${result.status}.`);
  }
  return JSON.parse(result.stdout.trim()) as Record<string, string | null>;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('root environment loader', () => {
  it('loads root env values, preserves injected values, resolves duplicates in favor of root, and excludes CLI credentials', () => {
    const { rootDirectory, webDirectory } = createWorkspace();
    writeFileSync(
      path.join(rootDirectory, '.env.local'),
      [
        'DALASHIFT_ENV_ROOT_VALUE=root',
        'DALASHIFT_ENV_DEPLOYMENT_VALUE=root-fallback',
        'SUPABASE_ACCESS_TOKEN=root-cli-token',
        'SUPABASE_DB_PASSWORD=root-db-password',
      ].join('\n'),
    );
    writeFileSync(
      path.join(webDirectory, '.env.local'),
      ['DALASHIFT_ENV_ROOT_VALUE=app', 'DALASHIFT_ENV_APP_VALUE=app-only'].join('\n'),
    );

    const environment = loadEnvironment(rootDirectory, webDirectory, {
      ...process.env,
      DALASHIFT_ENV_DEPLOYMENT_VALUE: 'deployment',
      SUPABASE_ACCESS_TOKEN: 'inherited-cli-token',
      SUPABASE_DB_PASSWORD: 'inherited-db-password',
    });

    expect(environment).toMatchObject({
      DALASHIFT_ENV_ROOT_VALUE: 'root',
      DALASHIFT_ENV_APP_VALUE: 'app-only',
      DALASHIFT_ENV_DEPLOYMENT_VALUE: 'deployment',
      SUPABASE_ACCESS_TOKEN: null,
      SUPABASE_DB_PASSWORD: null,
    });
  });

  it('continues when the root local environment file is absent', () => {
    const { rootDirectory, webDirectory } = createWorkspace();

    expect(loadEnvironment(rootDirectory, webDirectory, process.env)).toMatchObject({
      DALASHIFT_ENV_ROOT_VALUE: null,
      DALASHIFT_ENV_APP_VALUE: null,
    });
  });
});

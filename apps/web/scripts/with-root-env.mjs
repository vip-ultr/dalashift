import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

const webDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(webDirectory, '../..');
const nextCliPath = path.join(webDirectory, 'node_modules', 'next', 'dist', 'bin', 'next');
const cliOnlyEnvironmentKeys = ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_PASSWORD'];

export function prepareWebEnvironment(rootDirectory, dev) {
  loadEnvConfig(rootDirectory, dev);

  for (const key of cliOnlyEnvironmentKeys) {
    delete process.env[key];
  }
  delete process.env.__NEXT_PROCESSED_ENV;
}

const isEntrypoint =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const [command, ...nextArguments] = process.argv.slice(2);
  if (!command || !['dev', 'build', 'start'].includes(command)) {
    console.error('Usage: node scripts/with-root-env.mjs <dev|build|start> [...Next.js arguments]');
    process.exitCode = 2;
  } else {
    prepareWebEnvironment(repositoryRoot, command === 'dev');

    const bundlerArguments = command === 'dev' || command === 'build' ? ['--webpack'] : [];
    const nextProcess = spawn(
      process.execPath,
      [nextCliPath, command, ...bundlerArguments, ...nextArguments],
      {
        cwd: webDirectory,
        env: process.env,
        stdio: 'inherit',
      },
    );

    nextProcess.on('error', (error) => {
      console.error('Unable to start Next.js.', error);
      process.exitCode = 1;
    });

    nextProcess.on('exit', (code, signal) => {
      process.exitCode = signal === 'SIGINT' ? 130 : (code ?? 1);
    });

    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => nextProcess.kill(signal));
    }
  }
}

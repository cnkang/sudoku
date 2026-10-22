import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkToolchainVersions } from './check-toolchain-versions.mjs';

const manifest = {
  devDependencies: {
    'vite-plus': '1.3.0',
    vite: 'npm:@voidzero-dev/vite-plus-core@1.3.0',
    vitest: '5.0.5',
    '@vitest/coverage-v8': '5.0.5',
    '@vitest/ui': '5.0.5',
  },
};
const vitePlus = {
  version: '1.3.0',
  dependencies: { vite: 'npm:@voidzero-dev/vite-plus-core@1.3.0', vitest: '5.0.5' },
};
const installed = {
  vite: '1.3.0',
  vitest: '5.0.5',
  '@vitest/coverage-v8': '5.0.5',
  '@vitest/ui': '5.0.5',
};

test('accepts exact pins matching the bundled runner', () => {
  assert.deepEqual(checkToolchainVersions(manifest, vitePlus, installed), []);
});

for (const name of ['vitest', '@vitest/coverage-v8', '@vitest/ui']) {
  test(`rejects an independent ${name} manifest update`, () => {
    const changed = { devDependencies: { ...manifest.devDependencies, [name]: '5.0.4' } };
    assert.match(checkToolchainVersions(changed, vitePlus, installed).join('\n'), new RegExp(name));
  });
  test(`rejects a stale installed ${name}`, () => {
    const errors = checkToolchainVersions(manifest, vitePlus, { ...installed, [name]: '5.0.4' });
    assert.match(errors.join('\n'), /installed/);
  });
}

test('rejects a floating Vite Plus pin', () => {
  const changed = { devDependencies: { ...manifest.devDependencies, 'vite-plus': '^1.3.0' } };
  assert.match(checkToolchainVersions(changed, vitePlus, installed).join('\n'), /vite-plus/);
});

test('detects when a Vite Plus upgrade changes the bundled runner', () => {
  const upgraded = {
    version: '1.4.0',
    dependencies: { vite: 'npm:@voidzero-dev/vite-plus-core@1.4.0', vitest: '5.0.6' },
  };
  const errors = checkToolchainVersions(manifest, upgraded, installed);
  assert.ok(errors.length > 0);
  assert.match(errors.join('\n'), /5\.0\.6/);
});

test('rejects upstream Vite in place of the bundled core alias', () => {
  const changed = { devDependencies: { ...manifest.devDependencies, vite: '8.3.4' } };
  assert.match(checkToolchainVersions(changed, vitePlus, installed).join('\n'), /vite/);
});

test('rejects a stale installed Vite core', () => {
  const errors = checkToolchainVersions(manifest, vitePlus, { ...installed, vite: '1.0.0' });
  assert.match(errors.join('\n'), /installed/);
});

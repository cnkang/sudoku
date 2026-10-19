import { createRequire } from 'node:module';

const testPackages = ['vitest', '@vitest/coverage-v8', '@vitest/ui'];

export function checkToolchainVersions(manifest, vitePlus, installed) {
  const expected = { 'vite-plus': vitePlus.version, vite: vitePlus.dependencies.vite };
  for (const name of testPackages) expected[name] = vitePlus.dependencies.vitest;

  const errors = [];
  for (const [name, version] of Object.entries(expected)) {
    if (manifest.devDependencies[name] !== version) {
      errors.push(`${name}: pin exactly ${version}, found ${manifest.devDependencies[name]}`);
    }
    const installedVersion = name === 'vite' ? vitePlus.version : version;
    if (name !== 'vite-plus' && installed[name] !== installedVersion) {
      errors.push(`${name}: installed ${installed[name]}, expected ${installedVersion}`);
    }
  }
  return errors;
}

if (import.meta.main) {
  try {
    const require = createRequire(new URL('../package.json', import.meta.url));
    const manifest = require('./package.json');
    const vitePlusPath = require.resolve('vite-plus/package.json');
    const vitePlus = require(vitePlusPath);
    const bundledRequire = createRequire(vitePlusPath);
    const installed = Object.fromEntries(
      ['vite', ...testPackages].map((name) => [name, require(`${name}/package.json`).version]),
    );
    const errors = checkToolchainVersions(manifest, vitePlus, installed);
    const bundled = bundledRequire('vitest/package.json').version;
    if (bundled !== vitePlus.dependencies.vitest) {
      errors.push(
        `vite-plus: installed runner ${bundled}, expected ${vitePlus.dependencies.vitest}`,
      );
    }
    if (require.resolve('vitest') !== bundledRequire.resolve('vitest')) {
      errors.push(
        'vitest: project and vite-plus resolve different runner instances; reinstall dependencies',
      );
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Toolchain versions aligned: vite-plus ${vitePlus.version}, Vitest ${bundled}`);
  } catch (error) {
    console.error(`Toolchain version check failed:\n${error.message}`);
    console.error('Upgrade Vite Plus and its Vitest packages together; see README.md.');
    process.exitCode = 1;
  }
}

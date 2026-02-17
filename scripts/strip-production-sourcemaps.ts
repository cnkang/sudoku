#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const targets = ['.next', 'public'];

async function collectSourceMaps(
  dirPath: string,
  acc: string[]
): Promise<void> {
  let entries: Array<{
    isDirectory: () => boolean;
    isFile: () => boolean;
    name: string;
  }>;
  try {
    const dirEntries = await fs.readdir(dirPath, {
      withFileTypes: true,
      encoding: 'utf8',
    });
    entries = dirEntries as unknown as typeof entries;
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await collectSourceMaps(fullPath, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.map')) {
      acc.push(fullPath);
    }
  }
}

async function findAllSourceMaps(): Promise<string[]> {
  const files: string[] = [];
  for (const target of targets) {
    await collectSourceMaps(path.join(rootDir, target), files);
  }
  return files;
}

const sourceMapFiles = await findAllSourceMaps();
for (const file of sourceMapFiles) {
  await fs.unlink(file);
}

const relative = (filePath: string) => path.relative(rootDir, filePath);
if (sourceMapFiles.length > 0) {
  console.log(
    `[strip-production-sourcemaps] Removed ${sourceMapFiles.length} source maps`
  );
  for (const file of sourceMapFiles.slice(0, 20)) {
    console.log(`- ${relative(file)}`);
  }
  if (sourceMapFiles.length > 20) {
    console.log(`... and ${sourceMapFiles.length - 20} more`);
  }
} else {
  console.log('[strip-production-sourcemaps] No source maps found');
}

const remaining = await findAllSourceMaps();
if (remaining.length > 0) {
  console.error('[strip-production-sourcemaps] Source maps still present:');
  for (const file of remaining.slice(0, 20)) {
    console.error(`- ${relative(file)}`);
  }
  process.exit(1);
}

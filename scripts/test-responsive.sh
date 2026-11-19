#!/bin/bash
set -e

echo 'Running responsive Sudoku tests'
pnpm exec vitest run --reporter=verbose \
  src/components/__tests__/*.responsive.test.tsx \
  src/app/__tests__/*.responsive.test.tsx

echo 'Responsive tests passed. Run pnpm test:coverage for the full coverage gate.'

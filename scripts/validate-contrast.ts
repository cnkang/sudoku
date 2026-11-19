#!/usr/bin/env tsx
/**
 * WCAG Contrast Ratio Validator
 *
 * Validates that the color combinations documented in the Apple design system
 * meet their intended WCAG levels in BOTH light and dark mode:
 * - Body/UI text on primary surfaces: AAA (7:1)
 * - Tertiary text and semantic text on tinted backgrounds: AA (4.5:1)
 * - Non-text UI boundaries (focus ring, strong border): 3:1 (WCAG 1.4.11)
 *
 * This script:
 * 1. Parses apple-design-system.css (light :root and dark-mode :root)
 * 2. Calculates contrast ratios for the documented foreground/background pairs
 * 3. Fails if any combination misses its required level
 *
 * Usage:
 *   pnpm test:contrast
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// WCAG contrast ratio requirements
const WCAG_AAA_RATIO = 7;
const WCAG_AA_RATIO = 4.5;
const WCAG_NON_TEXT_RATIO = 3;

interface ColorPair {
  foreground: string;
  background: string;
  foregroundName: string;
  backgroundName: string;
  requiredRatio: number;
}

interface ValidationResult {
  pair: ColorPair;
  ratio: number;
  passes: boolean;
  wcagLevel: 'AAA' | 'AA' | 'FAIL';
}

type ColorPairDefinition = {
  foregroundName: string;
  backgroundName: string;
  requiredRatio?: number;
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = Number.parseInt((cleanHex[0] ?? '0') + (cleanHex[0] ?? '0'), 16);
    const g = Number.parseInt((cleanHex[1] ?? '0') + (cleanHex[1] ?? '0'), 16);
    const b = Number.parseInt((cleanHex[2] ?? '0') + (cleanHex[2] ?? '0'), 16);
    return { r, g, b };
  }

  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = Number.parseInt(cleanHex.substring(0, 2), 16);
    const g = Number.parseInt(cleanHex.substring(2, 4), 16);
    const b = Number.parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : ((rsRGB + 0.055) / 1.055) ** 2.4;
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : ((gsRGB + 0.055) / 1.055) ** 2.4;
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : ((bsRGB + 0.055) / 1.055) ** 2.4;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`);
  }

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine WCAG level based on contrast ratio
 */
function getWCAGLevel(ratio: number): 'AAA' | 'AA' | 'FAIL' {
  if (ratio >= WCAG_AAA_RATIO) return 'AAA';
  if (ratio >= WCAG_AA_RATIO) return 'AA';
  return 'FAIL';
}

/**
 * Extract --color-* hex declarations from a CSS block.
 * Only hex values are considered; light-dark() and rgba() tokens are skipped.
 */
function extractColorDeclarations(block: string): Map<string, string> {
  const colors = new Map<string, string>();
  const colorRegex = /--color-([a-z-]+):\s*(#[0-9A-Fa-f]{3,6})\b/g;
  for (const match of block.matchAll(colorRegex)) {
    const colorName = match[1];
    const colorValue = match[2];
    if (colorName && colorValue && !colors.has(colorName)) {
      colors.set(colorName, colorValue);
    }
  }
  return colors;
}

/**
 * Parse the light-mode :root block (before any media queries).
 */
function parseColorsFromCSS(cssContent: string): Map<string, string> {
  const rootStart = cssContent.indexOf(':root {');
  if (rootStart === -1) {
    throw new Error('Could not find :root section in CSS');
  }
  const mediaQueryStart = cssContent.indexOf('@media', rootStart);
  const rootEnd = mediaQueryStart === -1 ? cssContent.length : mediaQueryStart;
  return extractColorDeclarations(cssContent.substring(rootStart, rootEnd));
}

/**
 * Parse the dark-mode :root block inside @media (prefers-color-scheme: dark).
 */
function parseDarkColorsFromCSS(cssContent: string): Map<string, string> {
  const darkStart = cssContent.indexOf('@media (prefers-color-scheme: dark)');
  if (darkStart === -1) {
    throw new Error('Could not find dark-mode section in CSS');
  }
  const rootStart = cssContent.indexOf(':root {', darkStart);
  if (rootStart === -1) {
    throw new Error('Could not find dark-mode :root block in CSS');
  }
  // The dark block ends at the next top-level at-rule (@supports / @media).
  const nextAtRule = cssContent.slice(rootStart).search(/\n@(supports|media)/);
  const rootEnd = nextAtRule === -1 ? cssContent.length : rootStart + nextAtRule;
  return extractColorDeclarations(cssContent.substring(rootStart, rootEnd));
}

function addPairIfPresent(
  pairs: ColorPair[],
  colors: Map<string, string>,
  foregroundName: string,
  backgroundName: string,
  requiredRatio: number = WCAG_AAA_RATIO,
): void {
  const foreground = colors.get(foregroundName);
  const background = colors.get(backgroundName);

  if (!foreground || !background) {
    return;
  }

  pairs.push({
    foreground,
    background,
    foregroundName,
    backgroundName,
    requiredRatio,
  });
}

function addDefinedPairs(
  pairs: ColorPair[],
  colors: Map<string, string>,
  definitions: ColorPairDefinition[],
): void {
  for (const { foregroundName, backgroundName, requiredRatio } of definitions) {
    addPairIfPresent(pairs, colors, foregroundName, backgroundName, requiredRatio);
  }
}

/**
 * Documented usage patterns of the Apple design system tokens.
 * Names omit the shared --color- prefix.
 */
function getColorCombinationsToTest(colors: Map<string, string>): ColorPair[] {
  const pairs: ColorPair[] = [];
  const definitions: ColorPairDefinition[] = [
    // Primary text on surfaces — AAA
    { foregroundName: 'fg-primary', backgroundName: 'bg-primary' },
    { foregroundName: 'fg-primary', backgroundName: 'bg-secondary' },
    { foregroundName: 'fg-primary', backgroundName: 'bg-elevated' },
    { foregroundName: 'fg-secondary', backgroundName: 'bg-primary' },
    { foregroundName: 'fg-secondary', backgroundName: 'bg-secondary' },
    // Tertiary text is documented as hints-only — AA
    { foregroundName: 'fg-tertiary', backgroundName: 'bg-primary', requiredRatio: WCAG_AA_RATIO },
    // Brand actions — AAA on surface, AA for label-on-fill minimum
    { foregroundName: 'brand-primary', backgroundName: 'bg-primary' },
    { foregroundName: 'brand-primary-fg', backgroundName: 'brand-primary' },
    { foregroundName: 'brand-secondary', backgroundName: 'bg-primary' },
    {
      foregroundName: 'brand-secondary-fg',
      backgroundName: 'brand-secondary',
      requiredRatio: WCAG_AA_RATIO,
    },
    // Semantic text on surfaces — AAA; on tinted badges / as badge fill — AA
    { foregroundName: 'success', backgroundName: 'bg-primary' },
    { foregroundName: 'success', backgroundName: 'success-bg', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'success-fg', backgroundName: 'success', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'warning', backgroundName: 'bg-primary' },
    { foregroundName: 'warning', backgroundName: 'warning-bg', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'warning-fg', backgroundName: 'warning', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'error', backgroundName: 'bg-primary' },
    { foregroundName: 'error', backgroundName: 'error-bg', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'error-fg', backgroundName: 'error', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'info', backgroundName: 'bg-primary' },
    { foregroundName: 'info', backgroundName: 'info-bg', requiredRatio: WCAG_AA_RATIO },
    { foregroundName: 'info-fg', backgroundName: 'info', requiredRatio: WCAG_AA_RATIO },
    // Grid digits — AAA
    { foregroundName: 'cell-fixed-text', backgroundName: 'cell-bg' },
    { foregroundName: 'cell-input-text', backgroundName: 'cell-bg' },
    // Non-text UI boundaries — WCAG 1.4.11 (3:1)
    {
      foregroundName: 'focus-ring',
      backgroundName: 'bg-primary',
      requiredRatio: WCAG_NON_TEXT_RATIO,
    },
    {
      foregroundName: 'border-strong',
      backgroundName: 'bg-primary',
      requiredRatio: WCAG_NON_TEXT_RATIO,
    },
  ];
  addDefinedPairs(pairs, colors, definitions);
  return pairs;
}

/**
 * Validate all color combinations
 */
function validateContrast(pairs: ColorPair[]): ValidationResult[] {
  return pairs.map((pair) => {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const wcagLevel = getWCAGLevel(ratio);

    return {
      pair,
      ratio,
      passes: ratio >= pair.requiredRatio,
      wcagLevel,
    };
  });
}

/**
 * Format validation results for console output
 */
function formatResults(results: ValidationResult[], mode: string): string {
  const passed = results.filter((r) => r.passes);
  const failed = results.filter((r) => !r.passes);

  let output = '\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += `  WCAG Contrast Validation — ${mode} mode\n`;
  output += '═══════════════════════════════════════════════════════════\n\n';

  output += `Total combinations tested: ${results.length}\n`;
  output += `✓ Passed: ${passed.length}\n`;
  output += `✗ Failed: ${failed.length}\n\n`;

  if (failed.length > 0) {
    output += '───────────────────────────────────────────────────────────\n';
    output += '  FAILED COMBINATIONS\n';
    output += '───────────────────────────────────────────────────────────\n\n';

    for (const result of failed) {
      output += `✗ ${result.pair.foregroundName} on ${result.pair.backgroundName}\n`;
      output += `  Foreground: ${result.pair.foreground}\n`;
      output += `  Background: ${result.pair.background}\n`;
      output += `  Ratio: ${result.ratio.toFixed(2)}:1 (${result.wcagLevel})\n`;
      output += `  Required: ${result.pair.requiredRatio}:1\n\n`;
    }
  }

  if (passed.length > 0) {
    output += '───────────────────────────────────────────────────────────\n';
    output += '  PASSED COMBINATIONS\n';
    output += '───────────────────────────────────────────────────────────\n\n';

    for (const result of passed) {
      output += `✓ ${result.pair.foregroundName} on ${result.pair.backgroundName}: ${result.ratio.toFixed(2)}:1 (needs ${result.pair.requiredRatio}:1)\n`;
    }
    output += '\n';
  }

  output += '═══════════════════════════════════════════════════════════\n';

  return output;
}

/**
 * Main execution
 */
function main(): void {
  try {
    const cssPath = join(process.cwd(), 'src', 'styles', 'apple-design-system.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    const lightColors = parseColorsFromCSS(cssContent);
    const darkColors = parseDarkColorsFromCSS(cssContent);

    const lightResults = validateContrast(getColorCombinationsToTest(lightColors));
    const darkResults = validateContrast(getColorCombinationsToTest(darkColors));

    process.stdout.write(formatResults(lightResults, 'light'));
    process.stdout.write(formatResults(darkResults, 'dark'));

    const failedCount = [...lightResults, ...darkResults].filter((r) => !r.passes).length;
    if (failedCount > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    const errorOutput = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`Contrast validation failed: ${errorOutput}\n`);
    process.exit(1);
  }
}

// Export for testing
export {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  getWCAGLevel,
  parseColorsFromCSS,
  parseDarkColorsFromCSS,
  getColorCombinationsToTest,
  validateContrast,
};

// Run if executed directly
main();

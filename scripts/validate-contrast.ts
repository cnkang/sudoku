#!/usr/bin/env tsx
/**
 * WCAG AAA Contrast Ratio Validator
 *
 * Validates that all color combinations in the design system meet
 * WCAG AAA contrast requirements (7:1 minimum).
 *
 * This script:
 * 1. Parses the design-system.css file to extract color values
 * 2. Calculates contrast ratios for all foreground/background pairs
 * 3. Validates against WCAG AAA standard (7:1)
 * 4. Fails the build if any combination doesn't meet the standard
 *
 * Usage:
 *   pnpm tsx scripts/validate-contrast.ts
 *   node --loader tsx scripts/validate-contrast.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// WCAG AAA contrast ratio requirement
const WCAG_AAA_RATIO = 7.0;

interface ColorPair {
  foreground: string;
  background: string;
  foregroundName: string;
  backgroundName: string;
}

interface ValidationResult {
  pair: ColorPair;
  ratio: number;
  passes: boolean;
  wcagLevel: 'AAA' | 'AA' | 'FAIL';
}

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
function getRelativeLuminance(rgb: {
  r: number;
  g: number;
  b: number;
}): number {
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
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'FAIL';
}

/**
 * Parse CSS file to extract color values
 * Only extracts colors from the main :root section (light mode)
 */
function parseColorsFromCSS(cssContent: string): Map<string, string> {
  const colors = new Map<string, string>();

  // Find the main :root block (before any media queries)
  const rootStart = cssContent.indexOf(':root {');
  if (rootStart === -1) {
    throw new Error('Could not find :root section in CSS');
  }

  // Find the end of the first :root block (before @media)
  const mediaQueryStart = cssContent.indexOf('@media', rootStart);
  const rootEnd = mediaQueryStart !== -1 ? mediaQueryStart : cssContent.length;
  const rootContent = cssContent.substring(rootStart, rootEnd);

  // Match CSS custom property declarations: --color-name: #HEXVALUE;
  const colorRegex = /--color-([a-z-]+):\s*(#[0-9A-Fa-f]{3,6})/g;

  for (const match of rootContent.matchAll(colorRegex)) {
    const colorName = match[1];
    const colorValue = match[2];
    // Only store the first occurrence of each color
    if (colorName && colorValue && !colors.has(colorName)) {
      colors.set(colorName, colorValue);
    }
  }

  return colors;
}

/**
 * Define color combinations to test
 * These represent actual usage patterns in the application
 */
function getColorCombinationsToTest(colors: Map<string, string>): ColorPair[] {
  const pairs: ColorPair[] = [];

  // Primary colors on cream background
  const backgrounds = ['cream', 'cream-dark'];
  const foregrounds = ['coral', 'amber', 'teal', 'indigo', 'charcoal', 'slate'];

  for (const bg of backgrounds) {
    const bgColor = colors.get(bg);
    if (!bgColor) continue;

    for (const fg of foregrounds) {
      const fgColor = colors.get(fg);
      if (!fgColor) continue;

      pairs.push({
        foreground: fgColor,
        background: bgColor,
        foregroundName: fg,
        backgroundName: bg,
      });
    }
  }

  // Accent colors on cream background
  const accentForegrounds = ['hot-pink', 'electric', 'lime'];
  for (const bg of backgrounds) {
    const bgColor = colors.get(bg);
    if (!bgColor) continue;

    for (const fg of accentForegrounds) {
      const fgColor = colors.get(fg);
      if (!fgColor) continue;

      pairs.push({
        foreground: fgColor,
        background: bgColor,
        foregroundName: fg,
        backgroundName: bg,
      });
    }
  }

  // Semantic colors on their backgrounds
  const semanticPairs = [
    { fg: 'teal', bg: 'cream' }, // success
    { fg: 'amber', bg: 'cream' }, // warning
    { fg: 'coral', bg: 'cream' }, // error
    { fg: 'indigo', bg: 'cream' }, // hint
  ];

  for (const { fg, bg } of semanticPairs) {
    const fgColor = colors.get(fg);
    const bgColor = colors.get(bg);
    if (!fgColor || !bgColor) continue;

    pairs.push({
      foreground: fgColor,
      background: bgColor,
      foregroundName: fg,
      backgroundName: bg,
    });
  }

  // Dark text on light backgrounds
  const darkTexts = ['charcoal', 'slate'];
  for (const fg of darkTexts) {
    const fgColor = colors.get(fg);
    if (!fgColor) continue;

    for (const bg of backgrounds) {
      const bgColor = colors.get(bg);
      if (!bgColor) continue;

      pairs.push({
        foreground: fgColor,
        background: bgColor,
        foregroundName: fg,
        backgroundName: bg,
      });
    }
  }

  return pairs;
}

/**
 * Validate all color combinations
 */
function validateContrast(pairs: ColorPair[]): ValidationResult[] {
  return pairs.map(pair => {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const wcagLevel = getWCAGLevel(ratio);

    return {
      pair,
      ratio,
      passes: ratio >= WCAG_AAA_RATIO,
      wcagLevel,
    };
  });
}

/**
 * Format validation results for console output
 */
function formatResults(results: ValidationResult[]): string {
  const passed = results.filter(r => r.passes);
  const failed = results.filter(r => !r.passes);

  let output = '\n';
  output += '═══════════════════════════════════════════════════════════\n';
  output += '  WCAG AAA Contrast Ratio Validation Report\n';
  output += '═══════════════════════════════════════════════════════════\n\n';

  output += `Total combinations tested: ${results.length}\n`;
  output += `✓ Passed (≥7:1): ${passed.length}\n`;
  output += `✗ Failed (<7:1): ${failed.length}\n\n`;

  if (failed.length > 0) {
    output += '───────────────────────────────────────────────────────────\n';
    output += '  FAILED COMBINATIONS\n';
    output += '───────────────────────────────────────────────────────────\n\n';

    for (const result of failed) {
      output += `✗ ${result.pair.foregroundName} on ${result.pair.backgroundName}\n`;
      output += `  Foreground: ${result.pair.foreground}\n`;
      output += `  Background: ${result.pair.background}\n`;
      output += `  Ratio: ${result.ratio.toFixed(2)}:1 (${result.wcagLevel})\n`;
      output += `  Required: ${WCAG_AAA_RATIO}:1 (AAA)\n\n`;
    }
  }

  if (passed.length > 0) {
    output += '───────────────────────────────────────────────────────────\n';
    output += '  PASSED COMBINATIONS\n';
    output += '───────────────────────────────────────────────────────────\n\n';

    for (const result of passed) {
      output += `✓ ${result.pair.foregroundName} on ${result.pair.backgroundName}: ${result.ratio.toFixed(2)}:1\n`;
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
    // Read design system CSS file
    const cssPath = join(process.cwd(), 'src', 'styles', 'design-system.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    // Parse colors
    const colors = parseColorsFromCSS(cssContent);

    // Get color combinations to test
    const pairs = getColorCombinationsToTest(colors);

    // Validate contrast ratios
    const results = validateContrast(pairs);

    // Output results
    const report = formatResults(results);
    console.log(report);

    // Exit with error if any combinations failed
    const failedCount = results.filter(r => !r.passes).length;
    if (failedCount > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Contrast validation failed:', error);
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
  getColorCombinationsToTest,
  validateContrast,
};

// Run if executed directly
main();

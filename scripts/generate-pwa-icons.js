#!/usr/bin/env node

// Simple PWA icon generator for Multi-Size Sudoku
// Creates basic SVG-based icons for different sizes

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = "public/icons";

// Ensure icons directory exists
try {
  mkdirSync(publicDir, { recursive: true });
} catch (_error) {
  // Directory already exists
}

const writeLine = (message) => {
  process.stdout.write(`${message}\n`);
};

// Generate SVG icon template
function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0077BE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#005a9e;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${
    size / 2 - 4
  }" fill="url(#bg)" stroke="#fff" stroke-width="2"/>
  
  <!-- Sudoku grid representation -->
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <!-- 3x3 grid -->
    <rect x="0" y="0" width="${size * 0.6}" height="${
    size * 0.6
  }" fill="none" stroke="#fff" stroke-width="3" rx="4"/>
    
    <!-- Grid lines -->
    <line x1="${size * 0.2}" y1="0" x2="${size * 0.2}" y2="${
    size * 0.6
  }" stroke="#fff" stroke-width="1.5"/>
    <line x1="${size * 0.4}" y1="0" x2="${size * 0.4}" y2="${
    size * 0.6
  }" stroke="#fff" stroke-width="1.5"/>
    <line x1="0" y1="${size * 0.2}" x2="${size * 0.6}" y2="${
    size * 0.2
  }" stroke="#fff" stroke-width="1.5"/>
    <line x1="0" y1="${size * 0.4}" x2="${size * 0.6}" y2="${
    size * 0.4
  }" stroke="#fff" stroke-width="1.5"/>
    
    <!-- Sample numbers -->
    <text x="${size * 0.1}" y="${
    size * 0.15
  }" fill="#fff" font-family="Arial, sans-serif" font-size="${
    size * 0.08
  }" font-weight="bold" text-anchor="middle">5</text>
    <text x="${size * 0.3}" y="${
    size * 0.35
  }" fill="#fff" font-family="Arial, sans-serif" font-size="${
    size * 0.08
  }" font-weight="bold" text-anchor="middle">3</text>
    <text x="${size * 0.5}" y="${
    size * 0.55
  }" fill="#fff" font-family="Arial, sans-serif" font-size="${
    size * 0.08
  }" font-weight="bold" text-anchor="middle">7</text>
  </g>
  
  <!-- Child-friendly sparkle -->
  <g transform="translate(${size * 0.75}, ${size * 0.25})">
    <path d="M0,-8 L2,0 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,0 Z" fill="#FFD700" opacity="0.9"/>
  </g>
</svg>`;
}

// Generate icons for all sizes
iconSizes.forEach((size) => {
  const svgContent = generateSVGIcon(size);
  const filename = join(publicDir, `icon-${size}x${size}.svg`);

  writeFileSync(filename, svgContent);
  writeLine(`Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: "4x4", color: "#32CD32", number: "4" },
  { name: "6x6", color: "#FF6B35", number: "6" },
  { name: "9x9", color: "#9B59B6", number: "9" },
];

shortcuts.forEach((shortcut) => {
  const svgContent = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-${shortcut.name}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${shortcut.color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${shortcut.color}CC;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect x="4" y="4" width="88" height="88" fill="url(#bg-${shortcut.name})" rx="16"/>
    
    <!-- Grid representation -->
    <rect x="20" y="20" width="56" height="56" fill="none" stroke="#fff" stroke-width="2" rx="4"/>
    
    <!-- Size indicator -->
    <text x="48" y="58" fill="#fff" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">${shortcut.number}×${shortcut.number}</text>
  </svg>`;

  const filename = join(publicDir, `shortcut-${shortcut.name}.svg`);
  writeFileSync(filename, svgContent);
  writeLine(`Generated ${filename}`);
});

// Generate action icons
const actions = [
  { name: "play-action", path: "M20,12 L50,30 L20,48 Z", color: "#32CD32" },
  {
    name: "dismiss-action",
    path: "M20,20 L44,44 M44,20 L20,44",
    color: "#666",
  },
];

actions.forEach((action) => {
  const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="${action.color}" opacity="0.1"/>
    <path d="${action.path}" fill="none" stroke="${action.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const filename = join(publicDir, `${action.name}.svg`);
  writeFileSync(filename, svgContent);
  writeLine(`Generated ${filename}`);
});

// Generate badge icon
const badgeContent = `<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="32" fill="#0077BE"/>
  <text x="36" y="44" fill="#fff" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">S</text>
</svg>`;

writeFileSync(join(publicDir, "badge-72x72.svg"), badgeContent);
writeLine("Generated badge-72x72.svg");

writeLine("");
writeLine("All PWA icons generated successfully!");
writeLine(
  "Note: For production, consider converting SVG icons to PNG format for better browser compatibility."
);

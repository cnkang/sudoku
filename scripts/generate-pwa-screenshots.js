#!/usr/bin/env node

// Simple PWA screenshot generator for Multi-Size Sudoku
// Creates basic SVG-based screenshots for the manifest

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const screenshotsDir = "public/screenshots";

// Ensure screenshots directory exists
try {
  mkdirSync(screenshotsDir, { recursive: true });
} catch (_error) {
  // Directory already exists
}

const writeLine = (message) => {
  process.stdout.write(`${message}\n`);
};

// Generate mobile screenshot for 4x4 grid
const mobile4x4Screenshot = `<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="390" height="844" fill="#F0F8FF"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="390" height="80" fill="#0077BE"/>
  <text x="195" y="50" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Sudoku Kids - Easy 4×4</text>
  
  <!-- 4x4 Grid -->
  <g transform="translate(75, 150)">
    <!-- Grid background -->
    <rect x="0" y="0" width="240" height="240" fill="white" stroke="#0077BE" stroke-width="3" rx="8"/>
    
    <!-- Grid lines -->
    <line x1="60" y1="0" x2="60" y2="240" stroke="#0077BE" stroke-width="2"/>
    <line x1="120" y1="0" x2="120" y2="240" stroke="#0077BE" stroke-width="2"/>
    <line x1="180" y1="0" x2="180" y2="240" stroke="#0077BE" stroke-width="2"/>
    <line x1="0" y1="60" x2="240" y2="60" stroke="#0077BE" stroke-width="2"/>
    <line x1="0" y1="120" x2="240" y2="120" stroke="#0077BE" stroke-width="3"/>
    <line x1="0" y1="180" x2="240" y2="180" stroke="#0077BE" stroke-width="2"/>
    
    <!-- Sub-grid separator -->
    <line x1="120" y1="0" x2="120" y2="240" stroke="#0077BE" stroke-width="3"/>
    
    <!-- Sample numbers -->
    <text x="30" y="40" fill="#0077BE" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">1</text>
    <text x="150" y="40" fill="#0077BE" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">4</text>
    <text x="90" y="100" fill="#0077BE" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">3</text>
    <text x="210" y="160" fill="#0077BE" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">2</text>
    
    <!-- Empty cells with light background -->
    <rect x="60" y="0" width="60" height="60" fill="#F8FBFF" stroke="#E5E7EB" stroke-width="1"/>
    <rect x="0" y="60" width="60" height="60" fill="#F8FBFF" stroke="#E5E7EB" stroke-width="1"/>
    <rect x="180" y="60" width="60" height="60" fill="#F8FBFF" stroke="#E5E7EB" stroke-width="1"/>
  </g>
  
  <!-- Controls -->
  <g transform="translate(50, 450)">
    <rect x="0" y="0" width="80" height="50" fill="#32CD32" rx="8"/>
    <text x="40" y="30" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Hint</text>
    
    <rect x="100" y="0" width="80" height="50" fill="#FF6B35" rx="8"/>
    <text x="140" y="30" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Check</text>
    
    <rect x="200" y="0" width="90" height="50" fill="#9B59B6" rx="8"/>
    <text x="245" y="30" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">New Game</text>
  </g>
  
  <!-- Child-friendly elements -->
  <g transform="translate(320, 120)">
    <path d="M0,-8 L2,0 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,0 Z" fill="#FFD700" opacity="0.9"/>
  </g>
  
  <text x="195" y="550" fill="#666" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">Great job! Keep solving! 🌟</text>
</svg>`;

writeFileSync(join(screenshotsDir, "mobile-4x4.svg"), mobile4x4Screenshot);

// Generate mobile screenshot for 6x6 grid
const mobile6x6Screenshot = `<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="390" height="844" fill="#F0F8FF"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="390" height="80" fill="#FF6B35"/>
  <text x="195" y="50" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Sudoku Kids - Fun 6×6</text>
  
  <!-- 6x6 Grid -->
  <g transform="translate(45, 120)">
    <!-- Grid background -->
    <rect x="0" y="0" width="300" height="300" fill="white" stroke="#FF6B35" stroke-width="3" rx="8"/>
    
    <!-- Grid lines -->
    <line x1="50" y1="0" x2="50" y2="300" stroke="#FF6B35" stroke-width="1"/>
    <line x1="100" y1="0" x2="100" y2="300" stroke="#FF6B35" stroke-width="3"/>
    <line x1="150" y1="0" x2="150" y2="300" stroke="#FF6B35" stroke-width="1"/>
    <line x1="200" y1="0" x2="200" y2="300" stroke="#FF6B35" stroke-width="3"/>
    <line x1="250" y1="0" x2="250" y2="300" stroke="#FF6B35" stroke-width="1"/>
    
    <line x1="0" y1="50" x2="300" y2="50" stroke="#FF6B35" stroke-width="1"/>
    <line x1="0" y1="100" x2="300" y2="100" stroke="#FF6B35" stroke-width="1"/>
    <line x1="0" y1="150" x2="300" y2="150" stroke="#FF6B35" stroke-width="3"/>
    <line x1="0" y1="200" x2="300" y2="200" stroke="#FF6B35" stroke-width="1"/>
    <line x1="0" y1="250" x2="300" y2="250" stroke="#FF6B35" stroke-width="1"/>
    
    <!-- Sample numbers -->
    <text x="25" y="35" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">1</text>
    <text x="125" y="35" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">5</text>
    <text x="225" y="35" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">6</text>
    <text x="75" y="85" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">4</text>
    <text x="175" y="135" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">2</text>
    <text x="25" y="185" fill="#FF6B35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">6</text>
  </g>
  
  <!-- Controls -->
  <g transform="translate(50, 480)">
    <rect x="0" y="0" width="80" height="50" fill="#32CD32" rx="8"/>
    <text x="40" y="30" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Magic</text>
    <text x="40" y="45" fill="white" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Wand ✨</text>
    
    <rect x="100" y="0" width="80" height="50" fill="#FF6B35" rx="8"/>
    <text x="140" y="35" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Check</text>
    
    <rect x="200" y="0" width="90" height="50" fill="#9B59B6" rx="8"/>
    <text x="245" y="35" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Celebrate</text>
  </g>
  
  <text x="195" y="580" fill="#666" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">You're doing amazing! 🎉</text>
</svg>`;

writeFileSync(join(screenshotsDir, "mobile-6x6.svg"), mobile6x6Screenshot);

// Generate tablet screenshot for 9x9 grid
const tablet9x9Screenshot = `<svg width="1024" height="768" viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="768" fill="#F0F8FF"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="1024" height="100" fill="#9B59B6"/>
  <text x="512" y="60" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">Sudoku Challenge - Traditional 9×9</text>
  
  <!-- 9x9 Grid -->
  <g transform="translate(262, 150)">
    <!-- Grid background -->
    <rect x="0" y="0" width="450" height="450" fill="white" stroke="#9B59B6" stroke-width="4" rx="12"/>
    
    <!-- Grid lines -->
    ${Array.from({ length: 8 }, (_, i) => {
      const pos = (i + 1) * 50;
      const weight = (i + 1) % 3 === 0 ? 3 : 1;
      return `<line x1="${pos}" y1="0" x2="${pos}" y2="450" stroke="#9B59B6" stroke-width="${weight}"/>
              <line x1="0" y1="${pos}" x2="450" y2="${pos}" stroke="#9B59B6" stroke-width="${weight}"/>`;
    }).join("")}
    
    <!-- Sample numbers in a classic Sudoku pattern -->
    <text x="25" y="35" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">5</text>
    <text x="75" y="35" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">3</text>
    <text x="225" y="35" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">7</text>
    <text x="25" y="85" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">6</text>
    <text x="175" y="85" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">1</text>
    <text x="225" y="85" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">9</text>
    <text x="275" y="85" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">5</text>
    <text x="75" y="135" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">9</text>
    <text x="125" y="135" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">8</text>
    <text x="375" y="135" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">6</text>
  </g>
  
  <!-- Side panel with controls -->
  <g transform="translate(750, 200)">
    <rect x="0" y="0" width="200" height="300" fill="white" stroke="#E5E7EB" stroke-width="2" rx="12"/>
    <text x="100" y="30" fill="#9B59B6" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Game Controls</text>
    
    <rect x="20" y="50" width="160" height="40" fill="#32CD32" rx="8"/>
    <text x="100" y="75" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Smart Hint</text>
    
    <rect x="20" y="110" width="160" height="40" fill="#FF6B35" rx="8"/>
    <text x="100" y="135" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Validate</text>
    
    <rect x="20" y="170" width="160" height="40" fill="#9B59B6" rx="8"/>
    <text x="100" y="195" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">New Puzzle</text>
    
    <text x="100" y="240" fill="#666" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Difficulty: Expert</text>
    <text x="100" y="260" fill="#666" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Time: 12:34</text>
    <text x="100" y="280" fill="#666" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Hints: 2 used</text>
  </g>
  
  <text x="512" y="650" fill="#666" font-family="Arial, sans-serif" font-size="18" text-anchor="middle">Challenge yourself with the classic 9×9 Sudoku! 🧠</text>
</svg>`;

writeFileSync(join(screenshotsDir, "tablet-9x9.svg"), tablet9x9Screenshot);

writeLine("Generated PWA screenshots:");
writeLine("- mobile-4x4.svg");
writeLine("- mobile-6x6.svg");
writeLine("- tablet-9x9.svg");
writeLine(
  "\\nNote: For production, consider converting SVG screenshots to PNG format for better compatibility."
);

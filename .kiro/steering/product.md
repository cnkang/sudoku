---
inclusion: always
---

# Product Requirements & Conventions

## Multi-Size Sudoku Challenge v3.0.0

Interactive web-based Sudoku game supporting 4×4, 6×6, and 9×9 grids with intelligent puzzle generation, child-friendly design, and comprehensive accessibility features. Built with modern web technologies for optimal mobile experience.

## Core Game Features

### Multi-Size Grid System

- **4×4 Sudoku Grid**: Beginner-friendly with 2×2 sub-grids, numbers 1-4, designed for young children
- **6×6 Sudoku Grid**: Intermediate level with 2×3 sub-grids, numbers 1-6, perfect for learning progression
- **9×9 Sudoku Grid**: Traditional Sudoku with 3×3 sub-grids, numbers 1-9, maintaining full compatibility
- **Adaptive Difficulty**: Each grid size has appropriate difficulty levels (4×4: 3-5 levels, 6×6: 5-7 levels, 9×9: 10 levels)
- **Seamless Switching**: Smooth transitions between grid sizes with state preservation

### Child-Friendly Design Philosophy

- **Large Touch Targets**: Minimum 50px touch areas optimized for small fingers
- **Gentle Error Handling**: Warm colors (orange/yellow) instead of harsh red, encouraging language
- **Positive Reinforcement**: Celebration animations, achievement badges, progress tracking
- **Educational Focus**: Hints with explanations, step-by-step tutorials, learning-oriented feedback
- **Accessibility First**: WCAG AAA compliance with 7:1 contrast ratios and screen reader support

### Modern Mobile Experience

- **Progressive Web App**: Installable app experience with offline functionality
- **Touch Gestures**: Swipe navigation, pinch-to-zoom, long-press for hints
- **Haptic Feedback**: Tactile responses for successful moves and achievements
- **Responsive Design**: Container Queries and modern CSS for perfect scaling
- **Performance Optimized**: React Server Components, code splitting, lazy loading

### Advanced Game Features

- **Smart Hint System**: "Magic Wand" feature with visual highlights and child-friendly explanations
- **Multiple Themes**: Ocean, Forest, Space themes with WCAG AAA compliant color schemes
- **Sound Design**: Optional cheerful sound effects for moves, completions, and achievements
- **Progress Tracking**: Separate statistics for each grid size with colorful rewards
- **Offline Support**: Service Worker for puzzle generation and gameplay without internet

## User Experience Requirements

### Child-Centric Interface

- **Visual Hierarchy**: Clear, intuitive layout with child-friendly icons and labels
- **Immediate Feedback**: Gentle animations for interactions, bouncing effects, sparkles
- **Error Prevention**: Input validation with helpful suggestions rather than blocking
- **Celebration System**: Confetti, stars, rainbow effects for puzzle completion
- **Encouraging Language**: "Try again!", "Almost there!", "Great job!" instead of error messages

### Mobile-First Design Standards

- **Touch Optimization**: 50px minimum touch targets, gesture support, haptic feedback
- **Responsive Layout**: CSS Grid, Flexbox, Container Queries for all screen sizes
- **Performance**: < 2.5s LCP, < 100ms FID, < 0.1 CLS on mobile networks
- **Battery Efficiency**: Optimized animations, efficient puzzle generation, smart caching
- **Offline Capability**: Full gameplay available without internet connection

### Accessibility Excellence

- **WCAG AAA Compliance**: 7:1 contrast ratios, multiple visual cues, pattern-based indicators
- **Screen Reader Support**: Comprehensive ARIA labels, audio descriptions, keyboard navigation
- **Motor Accessibility**: Adaptive touch targets, reduced timing requirements, alternative inputs
- **Cognitive Support**: Simplified language, clear instructions, optional tutorials
- **Customization**: Adjustable font sizes, high contrast mode, reduced motion options

## Development Conventions

### Modern Technology Integration

- **Next.js 16**: React Server Components, App Router, Turbopack bundling
- **React 19**: React Compiler optimizations, concurrent features, automatic memoization
- **TypeScript 5.9+**: Strict mode, latest language features, comprehensive type safety
- **Modern CSS**: Container Queries, CSS Grid, Custom Properties, View Transitions API

### Performance Standards

- **Core Web Vitals**: Lighthouse score 95+ on mobile, optimal LCP/FID/CLS metrics
- **Bundle Optimization**: Code splitting, lazy loading, tree shaking, < 15% size increase
- **Caching Strategy**: Service Worker, API caching, static asset optimization
- **Memory Efficiency**: Optimized puzzle generation, efficient state management

### Testing Requirements

- **Comprehensive Coverage**: 87.5% test coverage with unit and property-based tests
- **Accessibility Testing**: Automated WCAG compliance, screen reader compatibility
- **Mobile Testing**: Touch interaction validation, responsive design verification
- **Performance Testing**: Core Web Vitals monitoring, bundle size tracking
- **Child Experience Testing**: Age-appropriate interaction patterns, error handling validation

## Business Rules

### Educational Value

- **Progressive Learning**: 4×4 → 6×6 → 9×9 difficulty progression
- **Skill Development**: Pattern recognition, logical thinking, problem-solving
- **Positive Psychology**: Growth mindset messaging, effort-based praise, resilience building
- **Inclusive Design**: Accessible to children with various abilities and learning styles

### Technical Excellence

- **Modern Standards**: Latest web technologies, performance best practices
- **Scalable Architecture**: Configurable grid system, extensible theme system
- **Maintainable Code**: TypeScript strict mode, comprehensive testing, clear documentation
- **Future-Proof**: Progressive enhancement, modern browser features with fallbacks

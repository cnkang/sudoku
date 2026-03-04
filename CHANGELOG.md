# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-03

### Added
- Multi-size Sudoku gameplay across 4x4, 6x6, and 9x9 grids.
- Design system foundations:
  - Custom font setup with `next/font` and CSS variables.
  - Geometric color palette tokens and contrast validation script.
  - Animation primitives (ripple, burst, shake, reveal, confetti) with reduced-motion support.
  - Decorative geometric elements and cursor styling.
- Security hardening:
  - CSP generation utilities and nonce plumbing.
  - API security middleware for validation, origin checks, rate limiting, CSRF, and request limits.
  - Security event logging utilities and security-focused documentation.
- Monitoring and quality tooling:
  - Performance monitoring utilities for Web Vitals and cache metrics.
  - CI workflows for quality checks, security scanning, and E2E execution.

### Changed
- Refactored component loading strategy to increase lazy-loading coverage.
- Improved caching strategy with request-level and cross-request cache paths.
- Optimized async flows around puzzle loading and grid-size transitions.
- Migrated dependencies to pinned versions for reproducibility.
- Updated README with optimization and performance sections.

### Fixed
- CSP runtime behavior that previously blocked app scripts in browser execution.
- E2E stability issues in grid-size switching scenarios.
- API test expectations to align with sanitized production error responses.

## [Unreleased]
- Placeholder for upcoming changes.


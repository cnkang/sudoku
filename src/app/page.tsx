'use client';
import 'regenerator-runtime/runtime';
import { Suspense } from 'react';
import ModernSudokuApp from '../components/ModernSudokuApp';
import { getPerformanceMonitor } from '../utils/performance-monitoring';
import styles from './page.module.css';
import { pageStyles } from './page.styles';
import '../styles/modern-responsive.css';
import '../styles/modern-layouts.css';

/**
 * Main Sudoku game page component with modern architecture integration
 * Uses the new ModernSudokuApp component that wires together all features
 *
 * Requirements: 1.2, 1.3, 7.3, 8.1
 */
export default function Home() {
  'use memo'; // React Compiler directive for automatic optimization

  // Initialize performance monitoring for the page
  if (
    globalThis.window !== undefined &&
    process.env.NODE_ENV === 'development'
  ) {
    const monitor = getPerformanceMonitor();
    const startTime = performance.now();

    // Track page load performance
    globalThis.addEventListener('load', () => {
      const endTime = performance.now();
      const _loadTime = endTime - startTime;
      const _meetsRequirements = monitor.meetsPerformanceRequirements();
    });
  }

  return (
    <div className={`${styles.page} container-query-root modern-grid-layout`}>
      <main className={`${styles.main} modern-grid-main`}>
        <Suspense
          fallback={
            <div className="app-loading-fallback">
              <div className="loading-spinner" />
              <h1>Loading Sudoku Challenge...</h1>
              <p>Preparing your multi-size puzzle experience</p>
            </div>
          }
        >
          <ModernSudokuApp
            initialGridSize={9} // Default to 9x9 for backward compatibility
            initialChildMode={false}
            enablePWA={true}
            enableOfflineMode={true}
          />
        </Suspense>
      </main>

      {/* Inject styles for test environment compatibility */}
      <style>{pageStyles}</style>

      {/* Additional loading styles */}
      <style>{`
        .app-loading-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          gap: 1.5rem;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .app-loading-fallback .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .app-loading-fallback h1 {
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .app-loading-fallback p {
          font-size: clamp(1rem, 2vw, 1.125rem);
          color: #64748b;
          margin: 0;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-loading-fallback .loading-spinner {
            animation: none;
            border-top-color: #3b82f6;
          }
        }
      `}</style>
    </div>
  );
}

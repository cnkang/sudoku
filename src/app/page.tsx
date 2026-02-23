'use client';
import { Suspense } from 'react';
import ModernSudokuApp from '../components/ModernSudokuApp';
import { getPerformanceMonitor } from '../utils/performance-monitoring';
import styles from './page.module.css';
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
      <main id="main-content" className={`${styles.main} modern-grid-main`}>
        <Suspense
          fallback={
            <div className={styles.loadingFallback}>
              <div className={styles.loadingFallbackSpinner} />
              <h1 className={styles.loadingFallbackTitle}>
                Loading Sudoku Challenge...
              </h1>
              <p className={styles.loadingFallbackText}>
                Preparing your multi-size puzzle experience
              </p>
            </div>
          }
        >
          <ModernSudokuApp
            initialGridSize={9}
            initialChildMode={false}
            enablePWA={true}
            enableOfflineMode={true}
          />
        </Suspense>
      </main>
    </div>
  );
}

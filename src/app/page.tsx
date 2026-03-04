import {
  LazyCornerDecoration,
  LazyGeometricMesh,
} from '../components/LazyGridComponents';
import ModernSudokuApp from '../components/ModernSudokuApp';
import styles from './page.module.css';
import '../styles/modern-responsive.css';
import '../styles/modern-layouts.css';
import '../styles/asymmetric-layout.css';

/**
 * Main Sudoku game page component with modern architecture integration
 * Uses the new ModernSudokuApp component that wires together all features
 *
 * Requirements: 1.2, 1.3, 7.3, 8.1
 */
export default function Home() {
  return (
    <div className={`${styles.page} container-query-root modern-grid-layout`}>
      {/* Geometric mesh background decoration */}
      <LazyGeometricMesh />

      {/* Diagonal grid overlay for asymmetric composition */}
      <div className="diagonal-grid-overlay" />

      <main
        id="main-content"
        className={`${styles.main} modern-grid-main with-corner-decorations`}
      >
        <div className={styles.lcpHero} aria-hidden="true">
          <h1 className={styles.lcpHeroTitle}>Sudoku Challenge</h1>
        </div>

        {/* Corner decorations for geometric interest */}
        <LazyCornerDecoration position="top-left" />
        <LazyCornerDecoration position="bottom-right" />

        <ModernSudokuApp
          initialGridSize={9}
          initialChildMode={false}
          enablePWA={true}
          enableOfflineMode={true}
        />
      </main>
    </div>
  );
}

/**
 * Lazy-loaded PWA Grid Selector for Code Splitting Optimization
 * Implements React 19 performance optimizations with lazy loading
 */

import type { PWAGridSelectorProps } from "@/types";
import { createLazyComponent } from "@/utils/performance-monitoring";

// Lazy load the PWAGridSelector component
const LazyPWAGridSelector = createLazyComponent<PWAGridSelectorProps>(
  () => import("./PWAGridSelector"),
  // Fallback component while loading
  () => (
    <div className="grid-selector-loading modern-flex-controls">
      <div className="loading-skeleton">
        <div className="skeleton-header">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
        <div className="skeleton-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-option">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .grid-selector-loading {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .loading-skeleton {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .skeleton-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .skeleton-title {
          height: 2rem;
          background: #e2e8f0;
          border-radius: 0.5rem;
          margin-bottom: 0.5rem;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .skeleton-subtitle {
          height: 1rem;
          background: #e2e8f0;
          border-radius: 0.25rem;
          max-width: 200px;
          margin-left: auto;
          margin-right: auto;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .skeleton-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          background: white;
          border: 3px solid #e2e8f0;
          border-radius: 1rem;
          min-height: 200px;
        }

        .skeleton-icon {
          width: 3rem;
          height: 3rem;
          background: #e2e8f0;
          border-radius: 50%;
          margin-bottom: 1rem;
        }

        .skeleton-content {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .skeleton-text {
          height: 1rem;
          background: #e2e8f0;
          border-radius: 0.25rem;
          width: 100%;
        }

        .skeleton-text.short {
          width: 60%;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 640px) {
          .skeleton-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .skeleton-option {
            min-height: 160px;
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  )
);

export default LazyPWAGridSelector;

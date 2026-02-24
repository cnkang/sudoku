/**
 * Lazy-loaded grid components for code splitting optimization
 * Implements Requirements 8.2, 8.9 for React 19 performance optimization
 */

import React, { lazy, memo, Suspense } from 'react';
import type { GridConfig, PWAGridSelectorProps } from '@/types';
import type { AccessibilityControlsProps } from './AccessibilityControls';
import type { VisualFeedbackSystemProps } from './VisualFeedbackSystem';

// Loading fallback component with modern CSS
const GridLoadingFallback = memo(() => (
  <div className="grid-loading-fallback">
    <div className="loading-spinner" />
    <p>Loading grid...</p>
    <style>{`
      .grid-loading-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
        min-height: 200px;
        background: var(--card-background, white);
        border-radius: var(--border-radius, 0.5rem);
        box-shadow: var(--shadow-sm);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color, #e2e8f0);
        border-top: 3px solid var(--primary-color, #3b82f6);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      p {
        color: var(--foreground, #1e293b);
        font-size: 0.875rem;
        margin: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .loading-spinner {
          animation: none;
          border-top-color: var(--primary-color, #3b82f6);
        }
      }
    `}</style>
  </div>
));

GridLoadingFallback.displayName = 'GridLoadingFallback';

// Lazy load grid size specific components
const Grid4x4Component = lazy(() =>
  import('./grids/Grid4x4').then(module => ({ default: module.Grid4x4 }))
);

const Grid6x6Component = lazy(() =>
  import('./grids/Grid6x6').then(module => ({ default: module.Grid6x6 }))
);

const Grid9x9Component = lazy(() =>
  import('./grids/Grid9x9').then(module => ({ default: module.Grid9x9 }))
);

// Lazy load PWA components
const PWAGridSelectorComponent = lazy(() =>
  import('./PWAGridSelector').then(module => ({ default: module.default }))
);

const PWAInstallPromptComponent = lazy(() =>
  import('./PWAInstallPrompt').then(module => ({ default: module.default }))
);

// Lazy load accessibility components
const AccessibilityControlsComponent = lazy(() =>
  import('./AccessibilityControls').then(module => ({
    default: module.default,
  }))
);

const VisualFeedbackSystemComponent = lazy(() =>
  import('./VisualFeedbackSystem').then(module => ({
    default: module.default,
  }))
);

// Lazy load theme components
const ThemeSelectorComponent = lazy(() =>
  import('./ThemeSelector').then(module => ({ default: module.default }))
);

const ThemeProviderComponent = lazy(() =>
  import('./ThemeProvider').then(module => ({ default: module.default }))
);

// Props interfaces
interface LazyGridProps {
  gridConfig: GridConfig;
  puzzle: number[][];
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
  childMode?: boolean;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
}

type ThemeSelectorProps = {
  showChildFriendlyOnly?: boolean;
  showHighContrastToggle?: boolean;
  className?: string;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

// Grid size router with code splitting
export const LazyGridRouter = memo<LazyGridProps>(
  ({ gridConfig, ...props }) => {
    'use memo'; // React Compiler directive

    const GridComponent = React.useMemo<
      React.ComponentType<LazyGridProps>
    >(() => {
      switch (gridConfig.size) {
        case 4:
          return Grid4x4Component as unknown as React.ComponentType<LazyGridProps>;
        case 6:
          return Grid6x6Component as unknown as React.ComponentType<LazyGridProps>;
        case 9:
          return Grid9x9Component as unknown as React.ComponentType<LazyGridProps>;
        default:
          return Grid9x9Component as unknown as React.ComponentType<LazyGridProps>; // Fallback to 9x9
      }
    }, [gridConfig.size]);

    return (
      <Suspense fallback={<GridLoadingFallback />}>
        <GridComponent gridConfig={gridConfig} {...props} />
      </Suspense>
    );
  }
);

LazyGridRouter.displayName = 'LazyGridRouter';

// PWA Components with lazy loading
export const LazyPWAGridSelector = memo((props: PWAGridSelectorProps) => (
  <Suspense fallback={<GridLoadingFallback />}>
    <PWAGridSelectorComponent {...props} />
  </Suspense>
));

LazyPWAGridSelector.displayName = 'LazyPWAGridSelector';

export const LazyPWAInstallPrompt = memo((props: Record<string, never>) => (
  <Suspense fallback={<div>Loading install prompt...</div>}>
    <PWAInstallPromptComponent {...props} />
  </Suspense>
));

LazyPWAInstallPrompt.displayName = 'LazyPWAInstallPrompt';

// Accessibility Components with lazy loading
export const LazyAccessibilityControls = memo(
  (props: AccessibilityControlsProps) => (
    <Suspense fallback={<div>Loading accessibility controls...</div>}>
      <AccessibilityControlsComponent {...props} />
    </Suspense>
  )
);

LazyAccessibilityControls.displayName = 'LazyAccessibilityControls';

export const LazyVisualFeedbackSystem = memo(
  (props: VisualFeedbackSystemProps) => (
    <Suspense fallback={<div>Loading visual feedback...</div>}>
      <VisualFeedbackSystemComponent {...props} />
    </Suspense>
  )
);

LazyVisualFeedbackSystem.displayName = 'LazyVisualFeedbackSystem';

// Theme Components with lazy loading
export const LazyThemeSelector = memo((props: ThemeSelectorProps) => (
  <Suspense fallback={<div>Loading theme selector...</div>}>
    <ThemeSelectorComponent {...props} />
  </Suspense>
));

LazyThemeSelector.displayName = 'LazyThemeSelector';

export const LazyThemeProvider = memo(
  ({ children, ...props }: ThemeProviderProps) => (
    <Suspense fallback={<div>Loading theme provider...</div>}>
      <ThemeProviderComponent {...props}>{children}</ThemeProviderComponent>
    </Suspense>
  )
);

LazyThemeProvider.displayName = 'LazyThemeProvider';

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error }>;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
}

class LazyErrorBoundary extends React.Component<
  LazyWrapperProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const _error = error;
    const _errorInfo = errorInfo;
  }

  override render() {
    if (this.state.hasError) {
      const ErrorFallback = this.props.errorFallback;
      if (ErrorFallback && this.state.error) {
        return <ErrorFallback error={this.state.error} />;
      }
      return (
        <div className="lazy-error-fallback">
          <p>Something went wrong loading this component.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error }>
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  const FallbackComponent = fallback ?? GridLoadingFallback;

  return memo((props: P) => (
    <LazyErrorBoundary {...(errorFallback ? { errorFallback } : {})}>
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  ));
};

// Preload utilities for better UX
export const preloadGridComponent = (size: 4 | 6 | 9) => {
  switch (size) {
    case 4:
      return import('./grids/Grid4x4');
    case 6:
      return import('./grids/Grid6x6');
    case 9:
      return import('./grids/Grid9x9');
    default:
      return import('./grids/Grid9x9');
  }
};

export const preloadPWAComponents = () => {
  return Promise.all([
    import('./PWAGridSelector'),
    import('./PWAInstallPrompt'),
  ]);
};

export const preloadAccessibilityComponents = () => {
  return Promise.all([
    import('./AccessibilityControls'),
    import('./VisualFeedbackSystem'),
  ]);
};

export const preloadThemeComponents = () => {
  return Promise.all([import('./ThemeSelector'), import('./ThemeProvider')]);
};

// Bundle size optimization utilities
export const getComponentBundleSize = async (
  componentName: string
): Promise<number> => {
  if (globalThis.window === undefined) return 0;

  try {
    const entries = performance.getEntriesByName(componentName);
    if (entries.length > 0) {
      const entry = entries[0] as PerformanceResourceTiming;
      return entry.transferSize || 0;
    }
  } catch (error) {
    const _error = error;
  }

  return 0;
};

// React 19 optimization tracking for lazy components
export const useLazyComponentTracking = (componentName: string) => {
  const [loadTime, setLoadTime] = React.useState<number>(0);
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    const startTime = performance.now();

    const handleLoad = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      setIsLoaded(true);

      const _componentName = componentName;
    };

    // Simulate component load completion
    const timer = setTimeout(handleLoad, 0);

    return () => clearTimeout(timer);
  }, [componentName]);

  return { loadTime, isLoaded };
};

export default LazyGridRouter;

import type React from 'react';
import { useCallback } from 'react';
import type { ThemeConfig } from '@/types';
import styles from './AccessibilityControls.module.css';

export interface AccessibilityControlsProps {
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  onThemeChange: (themeId: string) => void;
  onHighContrastToggle: () => void;
  onReducedMotionToggle: () => void;
  onLargeTextToggle: () => void;
  childMode?: boolean;
  disabled?: boolean;
}

/**
 * Accessibility Controls Component
 * Provides theme selection and accessibility toggles with child-friendly design
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI control group composition
function AccessibilityControls({
  currentTheme,
  availableThemes,
  highContrast,
  reducedMotion,
  largeText,
  onThemeChange,
  onHighContrastToggle,
  onReducedMotionToggle,
  onLargeTextToggle,
  childMode = true,
  disabled = false,
}: AccessibilityControlsProps) {
  // Filter themes based on child mode
  const filteredThemes = availableThemes.filter(theme =>
    childMode
      ? theme.category === 'child-friendly' ||
        theme.category === 'high-contrast'
      : true
  );

  const handleThemeSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const themeId = event.target.value;
      onThemeChange(themeId);
    },
    [onThemeChange]
  );

  const controlsClassName = [
    styles.accessibilityControls,
    childMode && styles.childMode,
    highContrast && styles.highContrast,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={controlsClassName} data-testid="accessibility-controls">
      <h3 className={styles.title}>
        {childMode ? '🎨 Make it Perfect for You!' : 'Accessibility Settings'}
      </h3>

      {/* Theme Selector */}
      <div className={styles.controlGroup}>
        <label htmlFor="theme-selector" className={styles.label}>
          {childMode ? '🌈 Choose Your Adventure Theme:' : 'Theme:'}
        </label>
        <select
          id="theme-selector"
          value={currentTheme.id}
          onChange={handleThemeSelect}
          disabled={disabled}
          className={styles.themeSelector}
          aria-describedby="theme-description"
        >
          {filteredThemes.map(theme => (
            <option key={theme.id} value={theme.id}>
              {theme.displayName}
            </option>
          ))}
        </select>
        <div id="theme-description" className={styles.description}>
          {currentTheme.description}
        </div>
      </div>

      {/* High Contrast Toggle */}
      <div className={styles.controlGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={onHighContrastToggle}
            disabled={disabled}
            className={styles.toggleInput}
            aria-describedby="high-contrast-description"
          />
          <span className={styles.toggleSlider} aria-hidden="true" />
          <span className={styles.toggleText}>
            {childMode ? '🌙 Super Clear Colors' : 'High Contrast Mode'}
          </span>
        </label>
        <div id="high-contrast-description" className={styles.description}>
          {childMode
            ? 'Makes colors extra clear and easy to see!'
            : 'Increases contrast for better visibility'}
        </div>
      </div>

      {/* Reduced Motion Toggle */}
      <div className={styles.controlGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={onReducedMotionToggle}
            disabled={disabled}
            className={styles.toggleInput}
            aria-describedby="reduced-motion-description"
          />
          <span className={styles.toggleSlider} aria-hidden="true" />
          <span className={styles.toggleText}>
            {childMode ? '🐌 Calm Animations' : 'Reduce Motion'}
          </span>
        </label>
        <div id="reduced-motion-description" className={styles.description}>
          {childMode
            ? 'Makes animations slower and gentler'
            : 'Reduces animations and motion effects'}
        </div>
      </div>

      {/* Large Text Toggle */}
      <div className={styles.controlGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={largeText}
            onChange={onLargeTextToggle}
            disabled={disabled}
            className={styles.toggleInput}
            aria-describedby="large-text-description"
          />
          <span className={styles.toggleSlider} aria-hidden="true" />
          <span className={styles.toggleText}>
            {childMode ? '🔍 Big Numbers' : 'Large Text'}
          </span>
        </label>
        <div id="large-text-description" className={styles.description}>
          {childMode
            ? 'Makes all numbers bigger and easier to read!'
            : 'Increases text size for better readability'}
        </div>
      </div>

      {/* Pattern-based Visual Cues Info */}
      {childMode && (
        <div className={styles.infoSection}>
          <h4 className={styles.infoTitle}>🎯 Special Visual Helpers</h4>
          <div className={styles.patternExamples}>
            <div className={styles.patternExample}>
              <div
                className={`${styles.patternSample} ${styles.successPattern}`}
              />
              <span>Great job! (stripes)</span>
            </div>
            <div className={styles.patternExample}>
              <div
                className={`${styles.patternSample} ${styles.errorPattern}`}
              />
              <span>Try again! (dots)</span>
            </div>
            <div className={styles.patternExample}>
              <div
                className={`${styles.patternSample} ${styles.hintPattern}`}
              />
              <span>Helpful hint! (waves)</span>
            </div>
          </div>
          <p className={styles.infoText}>
            These patterns help you see different messages, even if colors look
            the same to you!
          </p>
        </div>
      )}

      {/* Quick Access Buttons */}
      <div className={styles.quickActions}>
        <button
          type="button"
          onClick={() => onThemeChange('high-contrast')}
          disabled={disabled || currentTheme.id === 'high-contrast'}
          className={`${styles.quickButton} ${styles.contrastButton}`}
          aria-label="Switch to high contrast theme"
        >
          {childMode ? '🌙 Super Clear' : 'High Contrast'}
        </button>

        <button
          type="button"
          onClick={() => onThemeChange('ocean')}
          disabled={disabled || currentTheme.id === 'ocean'}
          className={`${styles.quickButton} ${styles.oceanButton}`}
          aria-label="Switch to ocean theme"
        >
          {childMode ? '🌊 Ocean Fun' : 'Ocean Theme'}
        </button>

        {childMode && (
          <>
            <button
              type="button"
              onClick={() => onThemeChange('forest')}
              disabled={disabled || currentTheme.id === 'forest'}
              className={`${styles.quickButton} ${styles.forestButton}`}
              aria-label="Switch to forest theme"
            >
              🌲 Forest Adventure
            </button>

            <button
              type="button"
              onClick={() => onThemeChange('space')}
              disabled={disabled || currentTheme.id === 'space'}
              className={`${styles.quickButton} ${styles.spaceButton}`}
              aria-label="Switch to space theme"
            >
              🚀 Space Journey
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AccessibilityControls;

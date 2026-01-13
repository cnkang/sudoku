"use client";

import { useThemeContext } from "@/hooks/useTheme";
import { getChildFriendlyThemes } from "@/utils/themes";
import styles from "./ThemeSelector.module.css";

interface ThemeSelectorProps {
  showChildFriendlyOnly?: boolean;
  showHighContrastToggle?: boolean;
  className?: string;
}

/**
 * Theme Selector Component
 * Allows users to choose between available themes
 */
export default function ThemeSelector({
  showChildFriendlyOnly = false,
  showHighContrastToggle = true,
  className = "",
}: ThemeSelectorProps) {
  const {
    currentTheme,
    availableThemes,
    setTheme,
    toggleHighContrast,
    isHighContrastMode,
  } = useThemeContext();

  // Filter themes based on props
  const displayThemes = showChildFriendlyOnly
    ? getChildFriendlyThemes()
    : availableThemes.filter((theme) => theme.category !== "high-contrast");

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
  };

  return (
    <div className={`${styles.themeSelector} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Choose Your Adventure</h3>
        <p className={styles.description}>
          Pick a colorful theme that makes learning fun!
        </p>
      </div>

      <div className={styles.themeGrid}>
        {displayThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`${styles.themeCard} ${
              currentTheme.id === theme.id ? styles.selected : ""
            }`}
            onClick={() => handleThemeChange(theme.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleThemeChange(theme.id);
              }
            }}
            aria-label={`Select ${theme.displayName} theme`}
            aria-pressed={currentTheme.id === theme.id}
          >
            <div className={styles.themePreview}>
              <div
                className={styles.colorSwatch}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textOnPrimary,
                }}
              >
                <div className={styles.miniGrid}>
                  <div
                    className={styles.miniCell}
                    style={{ backgroundColor: theme.colors.cellBackground }}
                  />
                  <div
                    className={styles.miniCell}
                    style={{
                      backgroundColor: theme.colors.cellBackgroundFilled,
                    }}
                  />
                  <div
                    className={styles.miniCell}
                    style={{
                      backgroundColor: theme.colors.cellBackgroundSelected,
                    }}
                  />
                  <div
                    className={styles.miniCell}
                    style={{ backgroundColor: theme.colors.cellBackground }}
                  />
                </div>
              </div>

              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>{theme.displayName}</h4>
                <p className={styles.themeDescription}>{theme.description}</p>

                {theme.ageGroup === "children" && (
                  <span className={styles.childFriendlyBadge}>
                    👶 Kid-Friendly
                  </span>
                )}

                {theme.category === "high-contrast" && (
                  <span className={styles.accessibilityBadge}>
                    ♿ High Contrast
                  </span>
                )}
              </div>
            </div>

            {currentTheme.id === theme.id && (
              <div className={styles.selectedIndicator}>
                <span className={styles.checkmark}>✓</span>
                <span className={styles.selectedText}>Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {showHighContrastToggle && (
        <div className={styles.accessibilityControls}>
          <button
            type="button"
            className={`${styles.highContrastToggle} ${
              isHighContrastMode ? styles.active : ""
            }`}
            onClick={handleHighContrastToggle}
            aria-label={`${
              isHighContrastMode ? "Disable" : "Enable"
            } high contrast mode`}
            aria-pressed={isHighContrastMode}
          >
            <span className={styles.toggleIcon}>
              {isHighContrastMode ? "🔆" : "🌓"}
            </span>
            <span className={styles.toggleText}>High Contrast Mode</span>
            <span className={styles.toggleStatus}>
              {isHighContrastMode ? "ON" : "OFF"}
            </span>
          </button>

          <p className={styles.accessibilityNote}>
            High contrast mode improves visibility for users with visual
            impairments
          </p>
        </div>
      )}
    </div>
  );
}

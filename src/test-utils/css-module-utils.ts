/**
 * Utility functions for testing components that use CSS modules
 */

/**
 * Get elements by CSS module class name
 * Since CSS modules hash class names, we need to use attribute selectors
 */
export const getByModuleClass = (className: string) => {
  return document.querySelectorAll(`[class*="${className}"]`);
};

/**
 * Check if an element has a CSS module class
 */
export const hasModuleClass = (
  element: Element,
  className: string
): boolean => {
  return element.className.includes(className);
};

/**
 * Get element by test ID (recommended approach for CSS modules)
 */
export const getByTestId = (testId: string) => {
  return document.querySelector(`[data-testid="${testId}"]`);
};

/**
 * Check if element has any of the expected CSS module classes
 */
export const hasAnyModuleClass = (
  element: Element,
  classNames: string[]
): boolean => {
  return classNames.some(className => element.className.includes(className));
};

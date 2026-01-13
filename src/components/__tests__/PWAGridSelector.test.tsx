import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PWAGridSelector from "../PWAGridSelector";

// Mock View Transitions API
const mockStartViewTransition = vi.fn((callback) => {
  // Execute the callback immediately to simulate the transition
  if (callback) {
    callback();
  }
  return {
    finished: Promise.resolve(),
  };
});
Object.defineProperty(document, "startViewTransition", {
  value: mockStartViewTransition,
  writable: true,
});

// Mock window.matchMedia for PWA detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.standalone for iOS PWA detection
Object.defineProperty(window.navigator, "standalone", {
  writable: true,
  value: false,
});

describe("PWAGridSelector", () => {
  const mockOnSizeChange = vi.fn();

  const defaultProps = {
    currentSize: 4 as const,
    onSizeChange: mockOnSizeChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation
    mockStartViewTransition.mockImplementation((callback) => {
      if (callback) {
        callback();
      }
      return {
        finished: Promise.resolve(),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders grid selector with all size options", () => {
      render(<PWAGridSelector {...defaultProps} />);

      expect(screen.getByTestId("pwa-grid-selector")).toBeInTheDocument();
      expect(screen.getByTestId("grid-option-4")).toBeInTheDocument();
      expect(screen.getByTestId("grid-option-6")).toBeInTheDocument();
      expect(screen.getByTestId("grid-option-9")).toBeInTheDocument();
    });

    it("displays correct titles and descriptions in normal mode", () => {
      render(<PWAGridSelector {...defaultProps} showDescriptions={true} />);

      expect(screen.getByText("Select Grid Size")).toBeInTheDocument();
      expect(
        screen.getByText("Choose your preferred Sudoku grid size")
      ).toBeInTheDocument();
      expect(screen.getByText("4×4 Grid")).toBeInTheDocument();
      expect(
        screen.getByText("Perfect for beginners and young learners")
      ).toBeInTheDocument();
    });

    it("displays child-friendly content in child mode", () => {
      render(
        <PWAGridSelector
          {...defaultProps}
          childMode={true}
          showDescriptions={true}
        />
      );

      expect(screen.getByText("Choose Your Puzzle Size!")).toBeInTheDocument();
      expect(
        screen.getByText("Pick the size that feels just right for you! 🎮")
      ).toBeInTheDocument();
      expect(screen.getByText("Easy 4×4")).toBeInTheDocument();
      expect(
        screen.getByText("Great for starting your Sudoku journey! 🌟")
      ).toBeInTheDocument();
    });

    it("shows current selection correctly", () => {
      render(<PWAGridSelector {...defaultProps} currentSize={6} />);

      const option6 = screen.getByTestId("grid-option-6");
      const option6Input = option6.querySelector('input[type="radio"]');
      expect(option6Input).toBeChecked();
      // Check for CSS module class pattern instead of exact class name
      expect(option6.className).toMatch(/selected/);
    });
  });

  describe("Grid Size Selection", () => {
    it("calls onSizeChange when different size is selected", () => {
      render(<PWAGridSelector {...defaultProps} currentSize={4} />);

      const option6 = screen.getByTestId("grid-option-6");
      fireEvent.click(option6);

      expect(mockOnSizeChange).toHaveBeenCalledWith(6);
    });

    it("does not call onSizeChange when same size is selected", () => {
      render(<PWAGridSelector {...defaultProps} currentSize={4} />);

      const option4 = screen.getByTestId("grid-option-4");
      fireEvent.click(option4);

      expect(mockOnSizeChange).not.toHaveBeenCalled();
    });

    it("prevents selection when disabled", () => {
      render(<PWAGridSelector {...defaultProps} disabled={true} />);

      const option6 = screen.getByTestId("grid-option-6");
      fireEvent.click(option6);

      expect(mockOnSizeChange).not.toHaveBeenCalled();
    });
  });

  describe("PWA Features", () => {
    it("shows offline indicator when in offline mode", () => {
      render(<PWAGridSelector {...defaultProps} offlineMode={true} />);

      expect(screen.getByText("📱 Playing offline")).toBeInTheDocument();
    });

    it("shows installed indicator when app is installed", () => {
      // Mock standalone mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<PWAGridSelector {...defaultProps} />);

      expect(screen.getByText("✅ App installed")).toBeInTheDocument();
    });
  });

  describe("Child-Friendly Features", () => {
    it("shows child features section in child mode", () => {
      render(<PWAGridSelector {...defaultProps} childMode={true} />);

      expect(screen.getByText("Colorful themes")).toBeInTheDocument();
      expect(screen.getByText("Fun sounds")).toBeInTheDocument();
      expect(screen.getByText("Earn rewards")).toBeInTheDocument();
      expect(screen.getByText("Track progress")).toBeInTheDocument();
    });

    it("applies child-friendly styling classes", () => {
      render(<PWAGridSelector {...defaultProps} childMode={true} />);

      const gridOptions = screen.getByRole("radiogroup");
      expect(gridOptions.className).toMatch(/childMode/);

      const option4 = screen.getByTestId("grid-option-4");
      expect(option4.className).toMatch(/childOption/);
      expect(option4.className).toMatch(/childFriendly/);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(<PWAGridSelector {...defaultProps} />);

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("aria-label", "Grid size selection");

      const option4 = screen.getByTestId("grid-option-4");
      const option4Input = option4.querySelector('input[type="radio"]');
      expect(option4Input).toBeChecked();
      expect(option4Input).toHaveAttribute("aria-label");
    });

    it("provides screen reader announcements structure", () => {
      render(<PWAGridSelector {...defaultProps} currentSize={4} />);

      // Check for aria-live region exists
      const srOnlyElements = document.querySelectorAll('[aria-live="polite"]');
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });

    it("supports keyboard navigation structure", () => {
      render(<PWAGridSelector {...defaultProps} />);

      const option4 = screen.getByTestId("grid-option-4");
      const option6 = screen.getByTestId("grid-option-6");
      const option4Input = option4.querySelector('input[type="radio"]');
      const option6Input = option6.querySelector('input[type="radio"]');

      // Check that elements are focusable
      expect(option4Input?.tabIndex).toBeGreaterThanOrEqual(0);
      expect(option6Input?.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it("has minimum touch target sizes", () => {
      render(<PWAGridSelector {...defaultProps} />);

      const option4 = screen.getByTestId("grid-option-4");

      // Check that the element has the CSS class that provides minimum dimensions
      expect(option4.className).toMatch(/gridOption/);
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive classes correctly", () => {
      render(<PWAGridSelector {...defaultProps} />);

      const selector = screen.getByTestId("pwa-grid-selector");
      expect(selector.className).toMatch(/gridSelector/);

      const gridOptions = screen.getByRole("radiogroup");
      expect(gridOptions.className).toMatch(/gridOptions/);
    });
  });

  describe("Component Structure", () => {
    it("renders all required grid options with correct metadata", () => {
      render(<PWAGridSelector {...defaultProps} showDescriptions={true} />);

      // Check 4x4 option
      expect(screen.getByText("4×4 Grid")).toBeInTheDocument();
      expect(screen.getByText("Beginner")).toBeInTheDocument();
      expect(screen.getByText("8-12 clues")).toBeInTheDocument();

      // Check 6x6 option
      expect(screen.getByText("6×6 Grid")).toBeInTheDocument();
      expect(screen.getByText("Intermediate")).toBeInTheDocument();
      expect(screen.getByText("18-28 clues")).toBeInTheDocument();

      // Check 9x9 option
      expect(screen.getByText("9×9 Grid")).toBeInTheDocument();
      expect(screen.getByText("Expert")).toBeInTheDocument();
      expect(screen.getByText("22-61 clues")).toBeInTheDocument();
    });

    it("renders grid previews for all options", () => {
      render(<PWAGridSelector {...defaultProps} />);

      // Check that all options have grid previews
      const option4 = screen.getByTestId("grid-option-4");
      const option6 = screen.getByTestId("grid-option-6");
      const option9 = screen.getByTestId("grid-option-9");

      // Each should have a grid preview element
      expect(
        option4.querySelector('[class*="gridPreview"]')
      ).toBeInTheDocument();
      expect(
        option6.querySelector('[class*="gridPreview"]')
      ).toBeInTheDocument();
      expect(
        option9.querySelector('[class*="gridPreview"]')
      ).toBeInTheDocument();
    });

    it("shows selected indicator for current selection", () => {
      render(<PWAGridSelector {...defaultProps} currentSize={4} />);

      const option4 = screen.getByTestId("grid-option-4");
      const selectedIndicator = option4.querySelector(
        '[class*="selectedIndicator"]'
      );

      expect(selectedIndicator).toBeInTheDocument();
      expect(selectedIndicator?.textContent).toBe("✓");
    });
  });
});

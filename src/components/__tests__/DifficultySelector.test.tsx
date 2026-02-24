import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DifficultySelector from '../DifficultySelector';
import {
  createAccessibilityTests,
  createDisabledStateTests,
  createEdgeCaseTests,
  createLoadingStateTests,
  createRenderingTests,
  createUserInteractionTests,
} from './shared-test-suites';
import {
  cleanupTest,
  createDifficultySelectorProps,
  setupTest,
} from './test-utils';

describe('DifficultySelector', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTest();
    mockOnChange = vi.fn();
  });

  afterEach(cleanupTest);

  // Use shared rendering tests
  createRenderingTests('DifficultySelector', () =>
    render(
      <DifficultySelector
        {...createDifficultySelectorProps({ onChange: mockOnChange })}
      />
    )
  );

  describe('Rendering', () => {
    beforeEach(() => {
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({ onChange: mockOnChange })}
        />
      );
    });

    it('should render difficulty selector with label', () => {
      expect(
        screen.getByLabelText('Select difficulty level')
      ).toBeInTheDocument();
      expect(screen.getByText('Difficulty Level:')).toBeInTheDocument();
    });

    it('should render all difficulty options (1-10)', () => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(10);
      expect(options[0]).toHaveValue('1');
      expect(options[9]).toHaveValue('10');
    });

    const difficultyLabels = [
      { level: 1, label: '1 (Easy)' },
      { level: 2, label: '2 (Easy)' },
      { level: 3, label: '3 (Medium)' },
      { level: 5, label: '5 (Medium)' },
      { level: 6, label: '6 (Hard)' },
      { level: 8, label: '8 (Hard)' },
      { level: 9, label: '9 (Expert)' },
      { level: 10, label: '10 (Expert)' },
    ];

    difficultyLabels.forEach(({ level, label }) => {
      it(`should show correct label for difficulty ${level}`, () => {
        expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
      });
    });
  });

  describe('Current Value Display', () => {
    it('should display current difficulty value', () => {
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            difficulty: 5,
            onChange: mockOnChange,
          })}
        />
      );
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('5');
    });
  });

  describe('Difficulty Label Logic', () => {
    const difficultyCategories = [
      { difficulty: 1, expected: '1 (Easy)', category: 'Easy' },
      { difficulty: 2, expected: '2 (Easy)', category: 'Easy' },
      { difficulty: 3, expected: '3 (Medium)', category: 'Medium' },
      { difficulty: 5, expected: '5 (Medium)', category: 'Medium' },
      { difficulty: 6, expected: '6 (Hard)', category: 'Hard' },
      { difficulty: 8, expected: '8 (Hard)', category: 'Hard' },
      { difficulty: 9, expected: '9 (Expert)', category: 'Expert' },
      { difficulty: 10, expected: '10 (Expert)', category: 'Expert' },
    ];

    difficultyCategories.forEach(({ difficulty, expected, category }) => {
      it(`should categorize difficulty ${difficulty} as ${category}`, () => {
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({
              difficulty,
              onChange: mockOnChange,
            })}
          />
        );
        expect(screen.getByDisplayValue(expected)).toBeInTheDocument();
      });
    });
  });

  // Use shared user interaction tests
  createUserInteractionTests([
    {
      name: 'valid difficulty selection',
      trigger: () => {
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({ onChange: mockOnChange })}
          />
        );
        fireEvent.change(screen.getByRole('combobox'), {
          target: { value: '7' },
        });
      },
      expectation: () => {
        expect(mockOnChange).toHaveBeenCalledWith(7);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      },
    },
    {
      name: 'multiple difficulty changes',
      trigger: () => {
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({ onChange: mockOnChange })}
          />
        );
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '3' } });
        fireEvent.change(select, { target: { value: '8' } });
      },
      expectation: () => {
        expect(mockOnChange).toHaveBeenCalledWith(3);
        expect(mockOnChange).toHaveBeenCalledWith(8);
        expect(mockOnChange).toHaveBeenCalledTimes(2);
      },
    },
    {
      name: 'invalid input rejection',
      trigger: () => {
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({ onChange: mockOnChange })}
          />
        );
        fireEvent.change(screen.getByRole('combobox'), {
          target: { value: 'invalid' },
        });
      },
      expectation: () => {
        expect(mockOnChange).not.toHaveBeenCalled();
      },
    },
  ]);

  // Use shared disabled state tests
  createDisabledStateTests(
    props =>
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            onChange: mockOnChange,
            ...props,
          })}
        />
      ),
    () => [screen.getByRole('combobox')]
  );

  describe('Disabled States - Additional', () => {
    const disabledStateTests = [
      {
        props: { isLoading: true },
        description: 'disable select when isLoading is true',
      },
      {
        props: { disabled: true, isLoading: true },
        description: 'disable select when both disabled and isLoading are true',
      },
      {
        props: { disabled: false, isLoading: false },
        description:
          'not disable select when both disabled and isLoading are false',
        shouldBeDisabled: false,
      },
    ];

    disabledStateTests.forEach(
      ({ props, description, shouldBeDisabled = true }) => {
        it(`should ${description}`, () => {
          render(
            <DifficultySelector
              {...createDifficultySelectorProps({
                onChange: mockOnChange,
                ...props,
              })}
            />
          );
          const select = screen.getByRole('combobox');

          if (shouldBeDisabled) {
            expect(select).toBeDisabled();
          } else {
            expect(select).not.toBeDisabled();
          }
        });
      }
    );
  });

  // Use shared loading state tests
  createLoadingStateTests(
    props =>
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            onChange: mockOnChange,
            ...props,
          })}
        />
      ),
    '🔄 Generating new puzzle...'
  );

  describe('Hint Messages', () => {
    it('should show normal hint when isLoading is false', () => {
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            isLoading: false,
            onChange: mockOnChange,
          })}
        />
      );
      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('🔄 Generating new puzzle...')
      ).not.toBeInTheDocument();
    });
  });

  // Use shared accessibility tests
  createAccessibilityTests(
    () =>
      render(
        <DifficultySelector
          {...createDifficultySelectorProps({ onChange: mockOnChange })}
        />
      ),
    [
      {
        description: 'should have proper accessibility attributes',
        check: () => {
          const select = screen.getByRole('combobox');
          expect(select).toHaveAttribute(
            'aria-label',
            'Select difficulty level'
          );
          expect(select).toHaveAttribute('id', 'difficulty-select');
          expect(select).toHaveAttribute(
            'title',
            'Change difficulty to get a new puzzle'
          );
        },
      },
      {
        description: 'should associate label with select element',
        check: () => {
          const label = screen.getByText('Difficulty Level:');
          const select = screen.getByRole('combobox');
          expect(label).toHaveAttribute('for', 'difficulty-select');
          expect(select).toHaveAttribute('id', 'difficulty-select');
        },
      },
      {
        description: 'should have proper option values and text',
        check: () => {
          const options = screen.getAllByRole('option');
          options.forEach((option, index) => {
            const expectedValue = (index + 1).toString();
            expect(option).toHaveAttribute('value', expectedValue);
          });
        },
      },
    ]
  );

  describe('Default Props', () => {
    it('should use default values for optional props', () => {
      const minimalProps = createDifficultySelectorProps({
        difficulty: 3,
        onChange: mockOnChange,
      });
      // Remove optional props to test defaults
      minimalProps.disabled = undefined;
      minimalProps.isLoading = undefined;

      render(<DifficultySelector {...minimalProps} />);

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();
    });
  });

  // Use shared edge case tests
  createEdgeCaseTests([
    {
      description: 'should handle difficulty value outside normal range',
      setup: () =>
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({
              difficulty: 15,
              onChange: mockOnChange,
            })}
          />
        ),
      expectation: () => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('1');
      },
    },
    {
      description: 'should handle zero difficulty',
      setup: () =>
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({
              difficulty: 0,
              onChange: mockOnChange,
            })}
          />
        ),
      expectation: () => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('1');
      },
    },
    {
      description: 'should handle negative difficulty',
      setup: () =>
        render(
          <DifficultySelector
            {...createDifficultySelectorProps({
              difficulty: -1,
              onChange: mockOnChange,
            })}
          />
        ),
      expectation: () => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('1');
      },
    },
  ]);

  describe('Component State Changes', () => {
    it('should update when difficulty prop changes', () => {
      const { rerender } = render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            difficulty: 1,
            onChange: mockOnChange,
          })}
        />
      );

      let select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');

      rerender(
        <DifficultySelector
          {...createDifficultySelectorProps({
            difficulty: 7,
            onChange: mockOnChange,
          })}
        />
      );

      select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('7');
    });

    it('should update disabled state when props change', () => {
      const { rerender } = render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            disabled: false,
            onChange: mockOnChange,
          })}
        />
      );

      let select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();

      rerender(
        <DifficultySelector
          {...createDifficultySelectorProps({
            disabled: true,
            onChange: mockOnChange,
          })}
        />
      );

      select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should update loading state when props change', () => {
      const { rerender } = render(
        <DifficultySelector
          {...createDifficultySelectorProps({
            isLoading: false,
            onChange: mockOnChange,
          })}
        />
      );

      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();

      rerender(
        <DifficultySelector
          {...createDifficultySelectorProps({
            isLoading: true,
            onChange: mockOnChange,
          })}
        />
      );

      expect(
        screen.getByText('🔄 Generating new puzzle...')
      ).toBeInTheDocument();
    });
  });
});

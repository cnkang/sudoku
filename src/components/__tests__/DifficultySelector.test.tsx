import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DifficultySelector from '../DifficultySelector';

describe('DifficultySelector', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    difficulty: 1,
    onChange: mockOnChange,
    disabled: false,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render difficulty selector with label', () => {
      render(<DifficultySelector {...defaultProps} />);

      expect(
        screen.getByLabelText('Select difficulty level')
      ).toBeInTheDocument();
      expect(screen.getByText('Difficulty Level:')).toBeInTheDocument();
    });

    it('should render all difficulty options (1-10)', () => {
      render(<DifficultySelector {...defaultProps} />);

      const options = screen.getAllByRole('option');

      expect(options).toHaveLength(10);
      expect(options[0]).toHaveValue('1');
      expect(options[9]).toHaveValue('10');
    });

    it('should show correct difficulty labels', () => {
      render(<DifficultySelector {...defaultProps} />);

      expect(
        screen.getByRole('option', { name: '1 (Easy)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '2 (Easy)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '3 (Medium)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '5 (Medium)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '6 (Hard)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '8 (Hard)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '9 (Expert)' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '10 (Expert)' })
      ).toBeInTheDocument();
    });

    it('should display current difficulty value', () => {
      render(<DifficultySelector {...defaultProps} difficulty={5} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('5');
    });
  });

  describe('Difficulty Label Logic', () => {
    it('should categorize difficulties correctly', () => {
      const { rerender } = render(
        <DifficultySelector {...defaultProps} difficulty={1} />
      );

      // Easy (1-2)
      expect(screen.getByDisplayValue('1 (Easy)')).toBeInTheDocument();

      rerender(<DifficultySelector {...defaultProps} difficulty={2} />);
      expect(screen.getByDisplayValue('2 (Easy)')).toBeInTheDocument();

      // Medium (3-5)
      rerender(<DifficultySelector {...defaultProps} difficulty={3} />);
      expect(screen.getByDisplayValue('3 (Medium)')).toBeInTheDocument();

      rerender(<DifficultySelector {...defaultProps} difficulty={5} />);
      expect(screen.getByDisplayValue('5 (Medium)')).toBeInTheDocument();

      // Hard (6-8)
      rerender(<DifficultySelector {...defaultProps} difficulty={6} />);
      expect(screen.getByDisplayValue('6 (Hard)')).toBeInTheDocument();

      rerender(<DifficultySelector {...defaultProps} difficulty={8} />);
      expect(screen.getByDisplayValue('8 (Hard)')).toBeInTheDocument();

      // Expert (9-10)
      rerender(<DifficultySelector {...defaultProps} difficulty={9} />);
      expect(screen.getByDisplayValue('9 (Expert)')).toBeInTheDocument();

      rerender(<DifficultySelector {...defaultProps} difficulty={10} />);
      expect(screen.getByDisplayValue('10 (Expert)')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when difficulty is selected', () => {
      render(<DifficultySelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '7' } });

      expect(mockOnChange).toHaveBeenCalledWith(7);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple difficulty changes', () => {
      render(<DifficultySelector {...defaultProps} />);

      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: '3' } });
      expect(mockOnChange).toHaveBeenCalledWith(3);

      fireEvent.change(select, { target: { value: '8' } });
      expect(mockOnChange).toHaveBeenCalledWith(8);

      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it('should not call onChange for invalid values', () => {
      render(<DifficultySelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'invalid' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle NaN values gracefully', () => {
      render(<DifficultySelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'abc' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled States', () => {
    it('should disable select when disabled prop is true', () => {
      render(<DifficultySelector {...defaultProps} disabled={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should disable select when isLoading is true', () => {
      render(<DifficultySelector {...defaultProps} isLoading={true} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should disable select when both disabled and isLoading are true', () => {
      render(
        <DifficultySelector
          {...defaultProps}
          disabled={true}
          isLoading={true}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should not disable select when both disabled and isLoading are false', () => {
      render(
        <DifficultySelector
          {...defaultProps}
          disabled={false}
          isLoading={false}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading hint when isLoading is true', () => {
      render(<DifficultySelector {...defaultProps} isLoading={true} />);

      expect(
        screen.getByText('🔄 Generating new puzzle...')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('💡 Changing difficulty will generate a new puzzle')
      ).not.toBeInTheDocument();
    });

    it('should show normal hint when isLoading is false', () => {
      render(<DifficultySelector {...defaultProps} isLoading={false} />);

      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('🔄 Generating new puzzle...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<DifficultySelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Select difficulty level');
      expect(select).toHaveAttribute('id', 'difficulty-select');
      expect(select).toHaveAttribute(
        'title',
        'Change difficulty to get a new puzzle'
      );
    });

    it('should associate label with select element', () => {
      render(<DifficultySelector {...defaultProps} />);

      const label = screen.getByText('Difficulty Level:');
      const select = screen.getByRole('combobox');

      expect(label).toHaveAttribute('for', 'difficulty-select');
      expect(select).toHaveAttribute('id', 'difficulty-select');
    });

    it('should have proper option values and text', () => {
      render(<DifficultySelector {...defaultProps} />);

      const options = screen.getAllByRole('option');

      options.forEach((option, index) => {
        const expectedValue = (index + 1).toString();
        expect(option).toHaveAttribute('value', expectedValue);
        // Note: React key props don't appear in DOM, so we don't test for them
      });
    });
  });

  describe('Default Props', () => {
    it('should use default values for optional props', () => {
      const minimalProps = {
        difficulty: 3,
        onChange: mockOnChange,
      };

      render(<DifficultySelector {...minimalProps} />);

      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle difficulty value outside normal range', () => {
      render(<DifficultySelector {...defaultProps} difficulty={15} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      // HTML select falls back to first option when value doesn't exist
      expect(select.value).toBe('1');
    });

    it('should handle zero difficulty', () => {
      render(<DifficultySelector {...defaultProps} difficulty={0} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');
    });

    it('should handle negative difficulty', () => {
      render(<DifficultySelector {...defaultProps} difficulty={-1} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');
    });
  });

  describe('Component State Changes', () => {
    it('should update when difficulty prop changes', () => {
      const { rerender } = render(
        <DifficultySelector {...defaultProps} difficulty={1} />
      );

      let select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');

      rerender(<DifficultySelector {...defaultProps} difficulty={7} />);

      select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('7');
    });

    it('should update disabled state when props change', () => {
      const { rerender } = render(
        <DifficultySelector {...defaultProps} disabled={false} />
      );

      let select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();

      rerender(<DifficultySelector {...defaultProps} disabled={true} />);

      select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should update loading state when props change', () => {
      const { rerender } = render(
        <DifficultySelector {...defaultProps} isLoading={false} />
      );

      expect(
        screen.getByText('💡 Changing difficulty will generate a new puzzle')
      ).toBeInTheDocument();

      rerender(<DifficultySelector {...defaultProps} isLoading={true} />);

      expect(
        screen.getByText('🔄 Generating new puzzle...')
      ).toBeInTheDocument();
    });
  });
});

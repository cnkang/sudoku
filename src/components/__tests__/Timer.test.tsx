import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Timer from '../Timer';

describe('Timer', () => {
  const defaultProps = {
    time: 0,
    isActive: false,
    isPaused: false,
  };

  describe('Time Formatting', () => {
    it('should format time correctly for seconds only', () => {
      render(<Timer {...defaultProps} time={45} />);
      expect(screen.getByText('00:45')).toBeInTheDocument();
    });

    it('should format time correctly for minutes and seconds', () => {
      render(<Timer {...defaultProps} time={125} />); // 2 minutes 5 seconds
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('should format time correctly for hours', () => {
      render(<Timer {...defaultProps} time={3665} />); // 1 hour 1 minute 5 seconds
      expect(screen.getByText('61:05')).toBeInTheDocument();
    });

    it('should pad single digits with zeros', () => {
      render(<Timer {...defaultProps} time={9} />);
      expect(screen.getByText('00:09')).toBeInTheDocument();
    });

    it('should handle zero time', () => {
      render(<Timer {...defaultProps} time={0} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should handle large time values', () => {
      render(<Timer {...defaultProps} time={5999} />); // 99 minutes 59 seconds
      expect(screen.getByText('99:59')).toBeInTheDocument();
    });
  });

  describe('Timer States', () => {
    it('should show "Time:" label', () => {
      render(<Timer {...defaultProps} />);
      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    it('should show paused status when paused', () => {
      render(<Timer {...defaultProps} isPaused={true} />);
      expect(screen.getByText('(Paused)')).toBeInTheDocument();
    });

    it('should not show paused status when not paused', () => {
      render(<Timer {...defaultProps} isPaused={false} />);
      expect(screen.queryByText('(Paused)')).not.toBeInTheDocument();
    });

    it('should not show paused status when active but not paused', () => {
      render(<Timer {...defaultProps} isActive={true} isPaused={false} />);
      expect(screen.queryByText('(Paused)')).not.toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should render with correct structure', () => {
      render(<Timer {...defaultProps} time={30} />);

      const timerContainer = screen.getByText('Time:').closest('.timer');
      expect(timerContainer).toBeInTheDocument();

      expect(screen.getByText('Time:')).toHaveClass('timer-label');
      expect(screen.getByText('00:30')).toHaveClass('timer-value');
    });

    it('should apply monospace font to timer value', () => {
      render(<Timer {...defaultProps} time={123} />);

      const timerValue = screen.getByText('02:03');
      expect(timerValue).toHaveClass('timer-value');
    });

    it('should show paused status with correct styling', () => {
      render(<Timer {...defaultProps} isPaused={true} />);

      const pausedStatus = screen.getByText('(Paused)');
      expect(pausedStatus).toHaveClass('timer-status');
    });
  });

  describe('Color States', () => {
    it('should handle inactive timer state', () => {
      render(<Timer {...defaultProps} isActive={false} isPaused={false} />);
      // Component should render without errors
      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    it('should handle active timer state', () => {
      render(<Timer {...defaultProps} isActive={true} isPaused={false} />);
      // Component should render without errors
      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    it('should handle paused timer state', () => {
      render(<Timer {...defaultProps} isActive={true} isPaused={true} />);
      // Component should render without errors and show paused status
      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('(Paused)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative time values gracefully', () => {
      render(<Timer {...defaultProps} time={-10} />);
      // Should still render, though negative time is not expected in normal use
      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    it('should handle very large time values', () => {
      render(<Timer {...defaultProps} time={999999} />);
      expect(screen.getByText('Time:')).toBeInTheDocument();
      // Should format as minutes:seconds (16666:39)
      expect(screen.getByText('16666:39')).toBeInTheDocument();
    });

    it('should handle decimal time values by flooring', () => {
      render(<Timer {...defaultProps} time={65.7} />);
      expect(screen.getByText('01:05')).toBeInTheDocument();
    });
  });

  describe('Component Props Combinations', () => {
    it('should handle all props being true', () => {
      render(<Timer time={150} isActive={true} isPaused={true} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('02:30')).toBeInTheDocument();
      expect(screen.getByText('(Paused)')).toBeInTheDocument();
    });

    it('should handle all props being false/zero', () => {
      render(<Timer time={0} isActive={false} isPaused={false} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.queryByText('(Paused)')).not.toBeInTheDocument();
    });

    it('should handle active but not paused state', () => {
      render(<Timer time={75} isActive={true} isPaused={false} />);

      expect(screen.getByText('Time:')).toBeInTheDocument();
      expect(screen.getByText('01:15')).toBeInTheDocument();
      expect(screen.queryByText('(Paused)')).not.toBeInTheDocument();
    });
  });
});

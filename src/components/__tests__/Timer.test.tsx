import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Timer from '../Timer';
import {
  createEdgeCaseTests,
  createRenderingTests,
} from './shared-test-suites';
import { cleanupTest, createTimerProps, setupTest } from './test-utils';

describe('Timer', () => {
  beforeEach(setupTest);
  afterEach(cleanupTest);

  // Use shared rendering test suite
  createRenderingTests('Timer', () =>
    render(<Timer {...createTimerProps()} />)
  );

  describe('Time Formatting', () => {
    const timeFormatTests = [
      { time: 45, expected: '00:45', description: 'seconds only' },
      { time: 125, expected: '02:05', description: 'minutes and seconds' },
      { time: 3665, expected: '61:05', description: 'hours' },
      { time: 9, expected: '00:09', description: 'single digits with zeros' },
      { time: 0, expected: '00:00', description: 'zero time' },
      { time: 5999, expected: '99:59', description: 'large time values' },
    ];

    timeFormatTests.forEach(({ time, expected, description }) => {
      it(`should format time correctly for ${description}`, () => {
        render(<Timer {...createTimerProps({ time })} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });

  describe('Timer States', () => {
    it('should show "Time:" label', () => {
      render(<Timer {...createTimerProps()} />);
      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    const pausedStateTests = [
      {
        isPaused: true,
        shouldShow: true,
        description: 'show paused status when paused',
      },
      {
        isPaused: false,
        shouldShow: false,
        description: 'not show paused status when not paused',
      },
      {
        isActive: true,
        isPaused: false,
        shouldShow: false,
        description: 'not show paused status when active but not paused',
      },
    ];

    pausedStateTests.forEach(({ shouldShow, description, ...props }) => {
      it(`should ${description}`, () => {
        render(<Timer {...createTimerProps(props)} />);
        const pausedText = screen.queryByText('(Paused)');

        if (shouldShow) {
          expect(pausedText).toBeInTheDocument();
        } else {
          expect(pausedText).not.toBeInTheDocument();
        }
      });
    });
  });

  describe('Visual States', () => {
    const visualTests = [
      {
        props: { time: 30 },
        description: 'render with correct structure',
        checks: [
          () => expect(screen.getByText('Time:')).toHaveClass('timer-label'),
          () => expect(screen.getByText('00:30')).toHaveClass('timer-value'),
        ],
      },
      {
        props: { time: 123 },
        description: 'apply monospace font to timer value',
        checks: [
          () => expect(screen.getByText('02:03')).toHaveClass('timer-value'),
        ],
      },
      {
        props: { isPaused: true },
        description: 'show paused status with correct styling',
        checks: [
          () =>
            expect(screen.getByText('(Paused)')).toHaveClass('timer-status'),
        ],
      },
    ];

    visualTests.forEach(({ props, description, checks }) => {
      it(`should ${description}`, () => {
        render(<Timer {...createTimerProps(props)} />);
        for (const check of checks) {
          check();
        }
      });
    });
  });

  describe('Color States', () => {
    const colorStateTests = [
      {
        props: { isActive: false, isPaused: false },
        description: 'handle inactive timer state',
      },
      {
        props: { isActive: true, isPaused: false },
        description: 'handle active timer state',
      },
      {
        props: { isActive: true, isPaused: true },
        description: 'handle paused timer state',
        extraCheck: () =>
          expect(screen.getByText('(Paused)')).toBeInTheDocument(),
      },
    ];

    colorStateTests.forEach(({ props, description, extraCheck }) => {
      it(`should ${description}`, () => {
        render(<Timer {...createTimerProps(props)} />);
        expect(screen.getByText('Time:')).toBeInTheDocument();
        if (extraCheck) extraCheck();
      });
    });
  });

  // Use shared edge case test suite
  createEdgeCaseTests([
    {
      description: 'should handle negative time values gracefully',
      setup: () => render(<Timer {...createTimerProps({ time: -10 })} />),
      expectation: () => expect(screen.getByText('Time:')).toBeInTheDocument(),
    },
    {
      description: 'should handle very large time values',
      setup: () => render(<Timer {...createTimerProps({ time: 999999 })} />),
      expectation: () => {
        expect(screen.getByText('Time:')).toBeInTheDocument();
        expect(screen.getByText('16666:39')).toBeInTheDocument();
      },
    },
    {
      description: 'should handle decimal time values by flooring',
      setup: () => render(<Timer {...createTimerProps({ time: 65.7 })} />),
      expectation: () => expect(screen.getByText('01:05')).toBeInTheDocument(),
    },
  ]);

  describe('Component Props Combinations', () => {
    const propCombinations = [
      {
        props: { time: 150, isActive: true, isPaused: true },
        expectations: [
          () => expect(screen.getByText('Time:')).toBeInTheDocument(),
          () => expect(screen.getByText('02:30')).toBeInTheDocument(),
          () => expect(screen.getByText('(Paused)')).toBeInTheDocument(),
        ],
        description: 'all props being true',
      },
      {
        props: { time: 0, isActive: false, isPaused: false },
        expectations: [
          () => expect(screen.getByText('Time:')).toBeInTheDocument(),
          () => expect(screen.getByText('00:00')).toBeInTheDocument(),
          () => expect(screen.queryByText('(Paused)')).not.toBeInTheDocument(),
        ],
        description: 'all props being false/zero',
      },
      {
        props: { time: 75, isActive: true, isPaused: false },
        expectations: [
          () => expect(screen.getByText('Time:')).toBeInTheDocument(),
          () => expect(screen.getByText('01:15')).toBeInTheDocument(),
          () => expect(screen.queryByText('(Paused)')).not.toBeInTheDocument(),
        ],
        description: 'active but not paused state',
      },
    ];

    propCombinations.forEach(({ props, expectations, description }) => {
      it(`should handle ${description}`, () => {
        render(<Timer {...createTimerProps(props)} />);
        for (const expectation of expectations) {
          expectation();
        }
      });
    });
  });
});

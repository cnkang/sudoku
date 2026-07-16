import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import FeedbackDisplay from '../FeedbackDisplay';
import type { FeedbackState } from '../feedbackTypes';

const hiddenFeedback: FeedbackState = { type: null, message: '', isVisible: false };

describe('FeedbackDisplay', () => {
  it('renders a visible message with its accessibility pattern', () => {
    render(
      <FeedbackDisplay
        feedback={{
          type: 'success',
          message: 'Great move',
          pattern: 'checkmarks',
          patternColor: '#166534',
          isVisible: true,
        }}
        childMode={false}
        reducedMotion={false}
      />,
    );

    const output = screen.getByTestId('feedback-success');
    expect(output).toHaveTextContent('Great move');
    expect(output).toHaveAttribute('data-pattern', 'checkmarks');
    expect(output).toHaveTextContent('Visual pattern: checkmarks for success feedback');
  });

  it('renders celebration particles only when motion is enabled', () => {
    const feedback: FeedbackState = {
      type: 'celebration',
      message: 'You did it',
      celebrationType: 'confetti',
      isVisible: true,
    };
    const { rerender } = render(
      <FeedbackDisplay feedback={feedback} childMode={false} reducedMotion={false} />,
    );

    expect(screen.getByTestId('celebration-particles').children).toHaveLength(20);

    rerender(<FeedbackDisplay feedback={feedback} childMode={false} reducedMotion={true} />);
    expect(screen.queryByTestId('celebration-particles')).not.toBeInTheDocument();
  });

  it('renders the pattern legend only in child mode', () => {
    const { rerender } = render(
      <FeedbackDisplay feedback={hiddenFeedback} childMode={true} reducedMotion={false} />,
    );
    expect(screen.getByTestId('pattern-legend')).toBeInTheDocument();

    rerender(<FeedbackDisplay feedback={hiddenFeedback} childMode={false} reducedMotion={false} />);
    expect(screen.queryByTestId('pattern-legend')).not.toBeInTheDocument();
  });

  it('announces visible feedback to screen readers', () => {
    render(
      <FeedbackDisplay
        feedback={{ type: 'hint', message: 'Try this', pattern: 'waves', isVisible: true }}
        childMode={false}
        reducedMotion={false}
      />,
    );

    expect(screen.getByTestId('feedback-announcement')).toHaveTextContent('Helpful hint provided');
  });
});

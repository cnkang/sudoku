import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { useFeedbackController } from '../useFeedbackController';

describe('useFeedbackController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it.each([
    { trigger: 'showSuccess' as const, duration: 3_000, type: 'success' },
    { trigger: 'showError' as const, duration: 4_000, type: 'error' },
    { trigger: 'showHint' as const, duration: 4_000, type: 'hint' },
  ])('hides $type feedback after $duration ms', ({ trigger, duration, type }) => {
    const { result } = renderHook(() =>
      useFeedbackController({ reducedMotion: true, highContrast: false }),
    );

    act(() => {
      result.current.triggers[trigger](`${type} message`);
    });
    expect(result.current.feedback).toMatchObject({ type, isVisible: true });

    act(() => {
      vi.advanceTimersByTime(duration);
    });
    expect(result.current.feedback.isVisible).toBe(false);
  });

  it('clears visible feedback immediately', () => {
    const { result } = renderHook(() =>
      useFeedbackController({ reducedMotion: true, highContrast: false }),
    );

    act(() => {
      result.current.triggers.showEncouragement('Keep going');
      result.current.triggers.clearFeedback();
    });

    expect(result.current.feedback).toEqual({ type: null, message: '', isVisible: false });
  });

  it('suppresses reinforcement DOM effects when reduced motion is enabled', () => {
    const { result } = renderHook(() =>
      useFeedbackController({ reducedMotion: true, highContrast: false }),
    );

    act(() => result.current.triggers.triggerPositiveReinforcement('sparkle'));

    expect(document.querySelectorAll('[data-feedback-effect="sparkle"]')).toHaveLength(0);
  });

  it('cancels scheduled work and removes generated effects on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useFeedbackController({ reducedMotion: false, highContrast: false }),
    );

    act(() => result.current.triggers.showSuccess('Great'));
    expect(document.querySelectorAll('[data-feedback-effect="sparkle"]')).toHaveLength(5);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(document.querySelectorAll('[data-feedback-effect="sparkle"]')).toHaveLength(0);
  });
});

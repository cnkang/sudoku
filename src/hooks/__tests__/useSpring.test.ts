import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { useSpring } from '../useSpring';

describe('useSpring', () => {
  it('snaps to targets when app-level reduced motion is enabled', () => {
    const { result } = renderHook(() => useSpring(0, { reducedMotion: true }));

    act(() => {
      result.current.setTarget(1, 100);
    });

    expect(result.current.value).toBe(1);
    expect(result.current.velocity).toBe(0);
    expect(result.current.isAnimating).toBe(false);
  });

  it('snaps later targets when the system prefers reduced motion', () => {
    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    try {
      const { result } = renderHook(() => useSpring(0));

      act(() => {
        result.current.setTarget(1, 100);
      });

      expect(result.current.value).toBe(1);
      expect(result.current.isAnimating).toBe(false);
    } finally {
      matchMediaSpy.mockRestore();
    }
  });
});

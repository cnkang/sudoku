import type React from 'react';
import { memo } from 'react';
import styles from './Timer.module.css';
import type { TimerProps } from '../types';

const formatTime = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = memo(({ time, isActive, isPaused }) => {
  'use memo';
  let stateClass = styles.idle;
  if (isPaused) {
    stateClass = styles.paused;
  } else if (isActive) {
    stateClass = styles.active;
  }
  return (
    <div className={`timer ${styles.timer} ${stateClass}`}>
      <span className={`timer-label ${styles.label}`}>Time: </span>
      <span className={`timer-value ${styles.value}`}>{formatTime(time)}</span>
      {isPaused && <span className={`timer-status ${styles.status}`}> (Paused)</span>}
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;

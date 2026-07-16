import type React from 'react';
import type { FeedbackState, PatternCueStyle } from './feedbackTypes';
import { PATTERN_CUES } from './feedbackTypes';
import styles from './VisualFeedbackSystem.module.css';

export interface FeedbackDisplayProps {
  feedback: FeedbackState;
  childMode: boolean;
  reducedMotion: boolean;
}

const patternClasses: Record<PatternCueStyle, string | undefined> = {
  stripes: styles.stripesPattern,
  dots: styles.dotsPattern,
  waves: styles.wavesPattern,
  stars: styles.starsPattern,
  checkmarks: styles.checkmarksPattern,
};

const getCelebrationEmoji = (
  celebrationType: 'confetti' | 'stars' | 'rainbow',
  index: number,
): string => {
  const emojis =
    celebrationType === 'stars'
      ? ['⭐', '🌟', '✨']
      : celebrationType === 'rainbow'
        ? ['🌈', '🦄', '✨', '🌟', '💫']
        : ['🎉', '🎊', '✨', '🌟', '⭐'];
  return emojis[index % emojis.length] ?? emojis[0] ?? '✨';
};

function PatternOverlay({ feedback }: Readonly<{ feedback: FeedbackState }>) {
  if (!feedback.pattern || !feedback.isVisible) return null;
  const cue = Object.values(PATTERN_CUES).find((item) => item.pattern === feedback.pattern);

  return (
    <div
      className={`${styles.patternOverlay} ${patternClasses[feedback.pattern] ?? ''}`}
      style={{ '--pattern-color': feedback.patternColor ?? '#000000' } as React.CSSProperties}
      aria-hidden="true"
      title={cue?.description ?? 'Pattern overlay for accessibility'}
    />
  );
}

function CelebrationParticles({ feedback, reducedMotion }: Readonly<FeedbackDisplayProps>) {
  if (!feedback.isVisible || feedback.type !== 'celebration' || reducedMotion) return null;
  const celebrationType = feedback.celebrationType ?? 'confetti';

  return (
    <div
      className={styles.celebrationContainer}
      aria-hidden="true"
      data-testid="celebration-particles"
    >
      {Array.from({ length: 20 }, (_, index) => (
        <div
          key={index}
          className={`${styles.celebrationParticle} ${styles[`particle${(index % 8) + 1}`] ?? ''}`}
          style={
            {
              '--delay': `${index * 0.1}s`,
              '--duration': `${2 + (index % 3)}s`,
            } as React.CSSProperties
          }
        >
          {getCelebrationEmoji(celebrationType, index)}
        </div>
      ))}
    </div>
  );
}

function FeedbackAnnouncement({ feedback }: Readonly<{ feedback: FeedbackState }>) {
  return (
    <output className={styles.srOnly} aria-live="polite" data-testid="feedback-announcement">
      {feedback.isVisible && feedback.type === 'celebration' && (
        <>Celebration! Confetti and sparkles everywhere!</>
      )}
      {feedback.isVisible && feedback.type === 'success' && <>Success! Great job!</>}
      {feedback.isVisible && feedback.type === 'error' && <>Gentle reminder to try again</>}
      {feedback.isVisible && feedback.type === 'hint' && <>Helpful hint provided</>}
      {feedback.isVisible && feedback.type === 'encouragement' && <>Encouragement message</>}
      {feedback.isVisible && feedback.pattern && ` Visual pattern: ${feedback.pattern}`}
      {feedback.isVisible && feedback.type === 'error' && feedback.pattern && ' for accessibility'}
    </output>
  );
}

function PatternLegend() {
  return (
    <div className={styles.patternLegend} data-testid="pattern-legend">
      <h4 className={styles.legendTitle}>Visual Helpers</h4>
      <div className={styles.legendItems}>
        {Object.entries(PATTERN_CUES).map(([key, cue]) => (
          <div key={key} className={styles.legendItem}>
            <div
              className={`${styles.legendPattern} ${styles[`${cue.pattern}Pattern`] ?? ''}`}
              style={
                {
                  '--pattern-color': cue.color,
                  backgroundColor: cue.backgroundColor,
                } as React.CSSProperties
              }
              aria-hidden="true"
            />
            <span className={styles.legendText}>
              {cue.type.charAt(0).toUpperCase() + cue.type.slice(1)}
            </span>
          </div>
        ))}
      </div>
      <p className={styles.legendDescription}>
        These patterns help you see different messages, even if colors look the same!
      </p>
    </div>
  );
}

export default function FeedbackDisplay({
  feedback,
  childMode,
  reducedMotion,
}: Readonly<FeedbackDisplayProps>) {
  const patternClass = feedback.pattern ? (patternClasses[feedback.pattern] ?? '') : '';

  return (
    <>
      {feedback.isVisible && feedback.type && (
        <output
          className={`${styles.feedbackMessage} ${styles[feedback.type] ?? ''} ${patternClass} ${
            feedback.subtype ? (styles[feedback.subtype] ?? '') : ''
          }`}
          aria-live="polite"
          data-testid={`feedback-${feedback.type}`}
          data-pattern={feedback.pattern}
        >
          <div className={styles.messageContent}>{feedback.message}</div>
          <PatternOverlay feedback={feedback} />
          <div className={styles.srOnly}>
            {feedback.pattern &&
              `Visual pattern: ${feedback.pattern} for ${feedback.type} feedback`}
          </div>
        </output>
      )}
      <CelebrationParticles
        feedback={feedback}
        childMode={childMode}
        reducedMotion={reducedMotion}
      />
      <FeedbackAnnouncement feedback={feedback} />
      {childMode && <PatternLegend />}
    </>
  );
}

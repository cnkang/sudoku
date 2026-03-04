/**
 * Geometric Shapes - Decorative Elements
 *
 * Pure CSS geometric shapes (circles, triangles, squares) with mesh gradient backgrounds.
 * These are purely decorative and marked with aria-hidden for accessibility.
 *
 * Requirements: 1.7, 1.8
 */

import type React from 'react';
import styles from './GeometricShapes.module.css';

interface ShapeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'coral' | 'amber' | 'teal' | 'indigo' | 'mesh';
  className?: string | undefined;
  animate?: boolean;
}

/**
 * Circle component - Pure CSS circle with gradient background
 */
export const Circle: React.FC<ShapeProps> = ({
  size = 'md',
  variant = 'coral',
  className = '',
  animate = false,
}) => {
  return (
    <div
      className={`${styles.circle} ${styles[size]} ${styles[variant]} ${animate ? styles.animate : ''} ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Triangle component - Pure CSS triangle using clip-path
 */
export const Triangle: React.FC<ShapeProps> = ({
  size = 'md',
  variant = 'teal',
  className = '',
  animate = false,
}) => {
  return (
    <div
      className={`${styles.triangle} ${styles[size]} ${styles[variant]} ${animate ? styles.animate : ''} ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Square component - Pure CSS square with optional rotation
 */
export const Square: React.FC<ShapeProps> = ({
  size = 'md',
  variant = 'amber',
  className = '',
  animate = false,
}) => {
  return (
    <div
      className={`${styles.square} ${styles[size]} ${styles[variant]} ${animate ? styles.animate : ''} ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Geometric Mesh - Background decorative element with multiple shapes
 */
export const GeometricMesh: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`${styles.geometricMesh} ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <Circle size="xl" variant="mesh" className={styles.meshCircle1} animate />
      <Triangle
        size="lg"
        variant="mesh"
        className={styles.meshTriangle1}
        animate
      />
      <Square size="md" variant="mesh" className={styles.meshSquare1} animate />
      <Circle size="lg" variant="mesh" className={styles.meshCircle2} animate />
      <Triangle
        size="sm"
        variant="mesh"
        className={styles.meshTriangle2}
        animate
      />
    </div>
  );
};

/**
 * Corner Decoration - Geometric shapes for corner placement
 */
export const CornerDecoration: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}> = ({ position, className = '' }) => {
  return (
    <div
      className={`${styles.cornerDecoration} ${styles[position]} ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {position === 'top-left' && (
        <>
          <Circle size="sm" variant="coral" className={styles.corner1} />
          <Triangle size="sm" variant="teal" className={styles.corner2} />
        </>
      )}
      {position === 'top-right' && (
        <>
          <Square size="sm" variant="amber" className={styles.corner1} />
          <Circle size="sm" variant="indigo" className={styles.corner2} />
        </>
      )}
      {position === 'bottom-left' && (
        <>
          <Triangle size="sm" variant="indigo" className={styles.corner1} />
          <Square size="sm" variant="teal" className={styles.corner2} />
        </>
      )}
      {position === 'bottom-right' && (
        <>
          <Circle size="sm" variant="amber" className={styles.corner1} />
          <Triangle size="sm" variant="coral" className={styles.corner2} />
        </>
      )}
    </div>
  );
};

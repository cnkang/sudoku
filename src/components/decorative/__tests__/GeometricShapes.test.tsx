/**
 * Tests for Geometric Shapes Components
 *
 * Validates that decorative geometric shapes render correctly
 * and are properly marked as decorative for accessibility.
 */

import { render } from '@testing-library/react';
import {
  Circle,
  CornerDecoration,
  GeometricMesh,
  Square,
  Triangle,
} from '../GeometricShapes';

describe('GeometricShapes', () => {
  describe('Circle', () => {
    it('should render with default props', () => {
      const { container } = render(<Circle />);
      const circle = container.firstChild as HTMLElement;

      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('aria-hidden', 'true');
      expect(circle).toHaveAttribute('role', 'presentation');
    });

    it('should apply size variant classes', () => {
      const { container } = render(<Circle size="lg" />);
      const circle = container.firstChild as HTMLElement;

      expect(circle.className).toContain('lg');
    });

    it('should apply color variant classes', () => {
      const { container } = render(<Circle variant="teal" />);
      const circle = container.firstChild as HTMLElement;

      expect(circle.className).toContain('teal');
    });

    it('should apply animation class when animate is true', () => {
      const { container } = render(<Circle animate />);
      const circle = container.firstChild as HTMLElement;

      expect(circle.className).toContain('animate');
    });

    it('should accept custom className', () => {
      const { container } = render(<Circle className="custom-class" />);
      const circle = container.firstChild as HTMLElement;

      expect(circle.className).toContain('custom-class');
    });
  });

  describe('Triangle', () => {
    it('should render with default props', () => {
      const { container } = render(<Triangle />);
      const triangle = container.firstChild as HTMLElement;

      expect(triangle).toBeInTheDocument();
      expect(triangle).toHaveAttribute('aria-hidden', 'true');
      expect(triangle).toHaveAttribute('role', 'presentation');
    });

    it('should apply size and variant classes', () => {
      const { container } = render(<Triangle size="sm" variant="indigo" />);
      const triangle = container.firstChild as HTMLElement;

      expect(triangle.className).toContain('sm');
      expect(triangle.className).toContain('indigo');
    });
  });

  describe('Square', () => {
    it('should render with default props', () => {
      const { container } = render(<Square />);
      const square = container.firstChild as HTMLElement;

      expect(square).toBeInTheDocument();
      expect(square).toHaveAttribute('aria-hidden', 'true');
      expect(square).toHaveAttribute('role', 'presentation');
    });

    it('should apply size and variant classes', () => {
      const { container } = render(<Square size="xl" variant="amber" />);
      const square = container.firstChild as HTMLElement;

      expect(square.className).toContain('xl');
      expect(square.className).toContain('amber');
    });
  });

  describe('GeometricMesh', () => {
    it('should render multiple geometric shapes', () => {
      const { container } = render(<GeometricMesh />);
      const mesh = container.firstChild as HTMLElement;

      expect(mesh).toBeInTheDocument();
      expect(mesh).toHaveAttribute('aria-hidden', 'true');
      expect(mesh).toHaveAttribute('role', 'presentation');

      // Should contain multiple child shapes
      expect(mesh.children.length).toBeGreaterThan(0);
    });

    it('should accept custom className', () => {
      const { container } = render(<GeometricMesh className="custom-mesh" />);
      const mesh = container.firstChild as HTMLElement;

      expect(mesh.className).toContain('custom-mesh');
    });
  });

  describe('CornerDecoration', () => {
    it('should render for top-left position', () => {
      const { container } = render(<CornerDecoration position="top-left" />);
      const decoration = container.firstChild as HTMLElement;

      expect(decoration).toBeInTheDocument();
      expect(decoration).toHaveAttribute('aria-hidden', 'true');
      expect(decoration).toHaveAttribute('role', 'presentation');
      expect(decoration.className).toContain('top-left');
    });

    it('should render for top-right position', () => {
      const { container } = render(<CornerDecoration position="top-right" />);
      const decoration = container.firstChild as HTMLElement;

      expect(decoration.className).toContain('top-right');
    });

    it('should render for bottom-left position', () => {
      const { container } = render(<CornerDecoration position="bottom-left" />);
      const decoration = container.firstChild as HTMLElement;

      expect(decoration.className).toContain('bottom-left');
    });

    it('should render for bottom-right position', () => {
      const { container } = render(
        <CornerDecoration position="bottom-right" />
      );
      const decoration = container.firstChild as HTMLElement;

      expect(decoration.className).toContain('bottom-right');
    });

    it('should contain child shapes for each position', () => {
      const { container } = render(<CornerDecoration position="top-left" />);
      const decoration = container.firstChild as HTMLElement;

      // Each corner should have 2 child shapes
      expect(decoration.children.length).toBe(2);
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CornerDecoration position="top-left" className="custom-corner" />
      );
      const decoration = container.firstChild as HTMLElement;

      expect(decoration.className).toContain('custom-corner');
    });
  });

  describe('Accessibility', () => {
    it('should mark all shapes as decorative with aria-hidden', () => {
      const { container: circleContainer } = render(<Circle />);
      const { container: triangleContainer } = render(<Triangle />);
      const { container: squareContainer } = render(<Square />);
      const { container: meshContainer } = render(<GeometricMesh />);
      const { container: cornerContainer } = render(
        <CornerDecoration position="top-left" />
      );

      expect(circleContainer.firstChild).toHaveAttribute('aria-hidden', 'true');
      expect(triangleContainer.firstChild).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      expect(squareContainer.firstChild).toHaveAttribute('aria-hidden', 'true');
      expect(meshContainer.firstChild).toHaveAttribute('aria-hidden', 'true');
      expect(cornerContainer.firstChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('should use presentation role for all shapes', () => {
      const { container: circleContainer } = render(<Circle />);
      const { container: triangleContainer } = render(<Triangle />);
      const { container: squareContainer } = render(<Square />);
      const { container: meshContainer } = render(<GeometricMesh />);
      const { container: cornerContainer } = render(
        <CornerDecoration position="top-left" />
      );

      expect(circleContainer.firstChild).toHaveAttribute(
        'role',
        'presentation'
      );
      expect(triangleContainer.firstChild).toHaveAttribute(
        'role',
        'presentation'
      );
      expect(squareContainer.firstChild).toHaveAttribute(
        'role',
        'presentation'
      );
      expect(meshContainer.firstChild).toHaveAttribute('role', 'presentation');
      expect(cornerContainer.firstChild).toHaveAttribute(
        'role',
        'presentation'
      );
    });
  });

  describe('Variants', () => {
    it('should support all size variants', () => {
      const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

      sizes.forEach(size => {
        const { container } = render(<Circle size={size} />);
        const circle = container.firstChild as HTMLElement;
        expect(circle.className).toContain(size);
      });
    });

    it('should support all color variants', () => {
      const variants: Array<'coral' | 'amber' | 'teal' | 'indigo' | 'mesh'> = [
        'coral',
        'amber',
        'teal',
        'indigo',
        'mesh',
      ];

      variants.forEach(variant => {
        const { container } = render(<Circle variant={variant} />);
        const circle = container.firstChild as HTMLElement;
        expect(circle.className).toContain(variant);
      });
    });
  });
});

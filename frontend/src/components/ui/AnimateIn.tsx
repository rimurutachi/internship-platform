'use client';

import { cn } from '@/lib/utils';

type AnimationType = 'fadeInUp' | 'fadeIn' | 'slideRight' | 'scaleIn';

interface AnimateInProps {
  children: React.ReactNode;
  /** Animation type — defaults to fadeInUp */
  animation?: AnimationType;
  /** Stagger index for sequential entrance (1-12) */
  staggerIndex?: number;
  /** Additional className */
  className?: string;
  /** HTML element to render — defaults to div */
  as?: React.ElementType;
}

const animationClassMap: Record<AnimationType, string> = {
  fadeInUp: 'animate-in',
  fadeIn: 'animate-fade',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale',
};

/**
 * AnimateIn Component
 * 
 * Lightweight wrapper that applies CSS entrance animations on mount.
 * Uses pure CSS animations — no JS animation libraries needed.
 * 
 * @example
 * <AnimateIn>
 *   <Card>Content</Card>
 * </AnimateIn>
 * 
 * @example Staggered grid
 * {items.map((item, i) => (
 *   <AnimateIn key={item.id} staggerIndex={i + 1}>
 *     <Card>{item.name}</Card>
 *   </AnimateIn>
 * ))}
 */
export function AnimateIn({
  children,
  animation = 'fadeInUp',
  staggerIndex,
  className,
  as: Component = 'div',
}: AnimateInProps) {
  const staggerClass = staggerIndex && staggerIndex >= 1 && staggerIndex <= 12
    ? `stagger-${staggerIndex}`
    : undefined;

  return (
    <Component
      className={cn(
        animationClassMap[animation],
        staggerClass,
        className,
      )}
    >
      {children}
    </Component>
  );
}

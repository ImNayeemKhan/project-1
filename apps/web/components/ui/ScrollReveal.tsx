'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Wrapper that fades + slides its children up on the first time they
 * enter the viewport. Respects `prefers-reduced-motion`.
 *
 *   <ScrollReveal><Section>...</Section></ScrollReveal>
 */
export function ScrollReveal({
  children,
  delay = 0,
  y = 16,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

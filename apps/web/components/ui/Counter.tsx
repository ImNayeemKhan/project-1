'use client';

import * as React from 'react';
import { useInView, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * Odometer-style count-up for hero stats. Triggers once when scrolled
 * into view, then locks to the final value. Falls back to the static
 * number for users with `prefers-reduced-motion`.
 *
 *   <Counter to={12400} duration={1.4} format={(n) => n.toLocaleString()} />
 */
export function Counter({
  to,
  from = 0,
  duration = 1.2,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  suffix = '',
  prefix = '',
}: {
  to: number;
  from?: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });

  const motionValue = useMotionValue(from);
  const stiffness = 60 / Math.max(duration, 0.1);
  const spring = useSpring(motionValue, { stiffness, damping: 20, mass: 0.8 });
  const [display, setDisplay] = React.useState(format(from));

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(format(to));
      return;
    }
    motionValue.set(to);
  }, [inView, to, motionValue, reduce, format]);

  React.useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(format(v)));
    return () => unsub();
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

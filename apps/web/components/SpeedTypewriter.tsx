'use client';

import { useEffect, useState } from 'react';

const WORDS = [
  'reliability.',
  '24/7 NOC support.',
  'BDIX entertainment mirrors.',
  'fiber to every room.',
  'local payment via bKash.',
];

export function SpeedTypewriter() {
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[idx];
    const tickMs = deleting ? 35 : 75;
    const t = setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, display.length + 1);
        setDisplay(next);
        if (next === word) {
          setTimeout(() => setDeleting(true), 1300);
        }
      } else {
        const next = word.slice(0, display.length - 1);
        setDisplay(next);
        if (next.length === 0) {
          setDeleting(false);
          setIdx((i) => (i + 1) % WORDS.length);
        }
      }
    }, tickMs);
    return () => clearTimeout(t);
  }, [display, deleting, idx]);

  return (
    <span className="text-brand-300">
      {display}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-brand-300 align-[-2px]" />
    </span>
  );
}

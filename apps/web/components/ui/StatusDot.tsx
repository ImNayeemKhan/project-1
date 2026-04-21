import * as React from 'react';
import { clsx } from './_clsx';

type Status = 'online' | 'degraded' | 'offline' | 'idle';

const colors: Record<Status, string> = {
  online: 'bg-success',
  degraded: 'bg-warning',
  offline: 'bg-danger',
  idle: 'bg-subtle',
};

export function StatusDot({ status, className, pulse = true }: { status: Status; className?: string; pulse?: boolean }) {
  return (
    <span
      aria-label={status}
      className={clsx('relative inline-flex h-2 w-2 rounded-full', colors[status], className)}
    >
      {pulse && status === 'online' ? (
        <span className="absolute inset-0 rounded-full bg-success anim-pulse-dot opacity-60" />
      ) : null}
    </span>
  );
}

import type { Block } from '../types';
import { formatDuration } from '../timer';

interface Props {
  block: Block | undefined;
  now: number;
  scheduleDone: boolean;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownClock({ block, now, scheduleDone }: Props) {
  if (!block) {
    return (
      <div className="clock clock--idle">
        <div className="clock__ring-placeholder">{scheduleDone ? '\u{1F389}' : '\u{23F3}'}</div>
        <div className="clock__label">{scheduleDone ? 'All sessions complete' : 'Starting soon…'}</div>
      </div>
    );
  }

  const total = block.end - block.start;
  const elapsed = Math.min(total, Math.max(0, now - block.start));
  const fraction = total > 0 ? elapsed / total : 0;
  const remaining = block.end - now;
  const offset = CIRCUMFERENCE * (1 - fraction);

  return (
    <div className={`clock clock--${block.kind}`}>
      <svg className="clock__ring" viewBox="0 0 120 120">
        <circle className="clock__ring-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="clock__ring-progress"
          cx="60"
          cy="60"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="clock__center">
        <div className="clock__time">{formatDuration(remaining)}</div>
        <div className="clock__kind">{block.kind === 'work' ? 'Focus' : 'Break'} · round {block.cycle}</div>
      </div>
    </div>
  );
}

import type { Block, RoomConfig } from './types';

/** Builds the full work/break/work/break... schedule for a room, starting at config.startTime. */
export function buildSchedule(config: RoomConfig): Block[] {
  const blocks: Block[] = [];
  let cursor = config.startTime;
  let index = 0;
  for (let cycle = 1; cycle <= config.iterations; cycle++) {
    const workEnd = cursor + config.workMinutes * 60_000;
    blocks.push({ index: index++, kind: 'work', cycle, start: cursor, end: workEnd });
    cursor = workEnd;

    const breakEnd = cursor + config.breakMinutes * 60_000;
    blocks.push({ index: index++, kind: 'break', cycle, start: cursor, end: breakEnd });
    cursor = breakEnd;
  }
  return blocks;
}

export type BlockStatus = 'past' | 'current' | 'future';

export function blockStatus(block: Block, now: number): BlockStatus {
  if (now >= block.end) return 'past';
  if (now >= block.start) return 'current';
  return 'future';
}

export function currentBlock(blocks: Block[], now: number): Block | undefined {
  return blocks.find((b) => now >= b.start && now < b.end);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatClockTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

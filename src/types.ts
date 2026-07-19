export type BlockKind = 'work' | 'break';

export interface RoomConfig {
  /** Epoch ms when the very first block starts. */
  startTime: number;
  workMinutes: number;
  breakMinutes: number;
  /** Number of work/break cycles. */
  iterations: number;
}

export interface Block {
  index: number;
  kind: BlockKind;
  /** 1-based work cycle number this block belongs to. */
  cycle: number;
  start: number;
  end: number;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  color: string;
}

/** intentions[participantId][blockIndex] = free text */
export type Intentions = Record<string, Record<number, string>>;

export interface RoomState {
  config: RoomConfig;
  participants: Participant[];
  intentions: Intentions;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

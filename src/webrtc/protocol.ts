import type { Completion, ConnectionStatus, Participant, RoomConfig, RoomState } from '../types';

export type ClientToHostMessage =
  | { type: 'hello'; id: string; name: string }
  | { type: 'set-name'; name: string }
  | { type: 'set-intention'; blockIndex: number; text: string }
  | { type: 'set-completion'; blockIndex: number; completion: Completion | null };

export type HostToClientMessage =
  | { type: 'snapshot'; state: RoomState; selfId: string }
  | { type: 'participant-joined'; participant: Participant }
  | { type: 'participant-left'; participantId: string }
  | { type: 'intention-updated'; participantId: string; blockIndex: number; text: string }
  | { type: 'completion-updated'; participantId: string; blockIndex: number; completion: Completion | null }
  | { type: 'name-updated'; participantId: string; name: string }
  | { type: 'config-updated'; config: RoomConfig }
  | { type: 'status-sync'; statuses: Record<string, ConnectionStatus> };

export type WireMessage = ClientToHostMessage | HostToClientMessage;

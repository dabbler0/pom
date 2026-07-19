import type { ConnectionStatus, Participant, RoomState } from '../types';

export type ClientToHostMessage =
  | { type: 'hello'; id: string; name: string }
  | { type: 'set-name'; name: string }
  | { type: 'set-intention'; blockIndex: number; text: string };

export type HostToClientMessage =
  | { type: 'snapshot'; state: RoomState; selfId: string }
  | { type: 'participant-joined'; participant: Participant }
  | { type: 'participant-left'; participantId: string }
  | { type: 'intention-updated'; participantId: string; blockIndex: number; text: string }
  | { type: 'name-updated'; participantId: string; name: string }
  | { type: 'status-sync'; statuses: Record<string, ConnectionStatus> };

export type WireMessage = ClientToHostMessage | HostToClientMessage;

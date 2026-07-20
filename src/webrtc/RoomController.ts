import type { Completion, ConnectionStatus, Participant, RoomConfig, RoomState } from '../types';
import { ICE_SERVERS, decodeSignal, encodeSignal, randomId, waitForIceGatheringComplete } from './signaling';
import type { ClientToHostMessage, HostToClientMessage, WireMessage } from './protocol';

const PARTICIPANT_COLORS = [
  '#e07a5f', '#3d9970', '#4a7fc9', '#c9974a', '#9067c6', '#c9527a', '#3aa6a0', '#b0855a',
];

function colorFor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}

type Listener = () => void;

interface GuestLink {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
}

/**
 * Owns the WebRTC plumbing and the shared room state, in either role:
 *  - host: authoritative for RoomState, star topology, relays every change to every guest.
 *  - guest: single data channel to the host, sends edit requests, applies host broadcasts.
 */
export class RoomController {
  readonly role: 'host' | 'guest';
  readonly selfId: string;

  private state: RoomState;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<Listener>();

  // host-only
  private pendingInvites = new Map<string, { pc: RTCPeerConnection; channel: RTCDataChannel }>();
  private guestLinks = new Map<string, GuestLink>();

  // guest-only
  private hostChannel?: RTCDataChannel;

  /** Snapshot object, replaced (not mutated) on change so it plays nicely with useSyncExternalStore. */
  private statuses: Record<string, ConnectionStatus> = {};

  private constructor(role: 'host' | 'guest', selfId: string, state: RoomState) {
    this.role = role;
    this.selfId = selfId;
    this.state = state;
  }

  static createHost(hostName: string, config: RoomConfig): RoomController {
    const hostId = randomId();
    const host: Participant = { id: hostId, name: hostName, isHost: true, color: colorFor(0) };
    const controller = new RoomController('host', hostId, {
      config,
      participants: [host],
      intentions: { [hostId]: {} },
      completions: { [hostId]: {} },
    });
    controller.setStatus(hostId, 'connected');
    return controller;
  }

  static createGuestPlaceholder(guestName: string): RoomController {
    const guestId = randomId();
    const placeholder: Participant = { id: guestId, name: guestName, isHost: false, color: colorFor(1) };
    const controller = new RoomController('guest', guestId, {
      config: { startTime: Date.now(), workMinutes: 25, breakMinutes: 5, iterations: 1 },
      participants: [placeholder],
      intentions: { [guestId]: {} },
      completions: { [guestId]: {} },
    });
    controller.setStatus(guestId, 'connecting');
    return controller;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  subscribeStatus(fn: Listener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private setStatus(participantId: string, status: ConnectionStatus) {
    this.statuses = { ...this.statuses, [participantId]: status };
    this.notifyStatus();
    // Guests only see their own link's status directly; the host knows everyone's,
    // so it fans that out. (No-op for a guest instance: its guestLinks map is always empty.)
    this.broadcast({ type: 'status-sync', statuses: this.statuses });
  }

  private notifyStatus() {
    this.statusListeners.forEach((fn) => fn());
  }

  getState(): RoomState {
    return this.state;
  }

  getStatus(participantId: string): ConnectionStatus {
    return this.statuses[participantId] ?? 'disconnected';
  }

  getAllStatuses(): Record<string, ConnectionStatus> {
    return this.statuses;
  }

  // ---------------------------------------------------------------------
  // Host: invite / accept-response flow
  // ---------------------------------------------------------------------

  async createInvite(): Promise<string> {
    if (this.role !== 'host') throw new Error('Only the host can create invites');
    const id = randomId();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const channel = pc.createDataChannel('pom');
    this.wireGuestChannel(channel, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGatheringComplete(pc);

    this.pendingInvites.set(id, { pc, channel });
    return encodeSignal({ v: 1, kind: 'offer', id, sdp: pc.localDescription! });
  }

  async acceptResponse(code: string): Promise<void> {
    if (this.role !== 'host') throw new Error('Only the host can accept responses');
    const payload = decodeSignal(code);
    if (payload.kind !== 'answer') throw new Error('That looks like an invite, not a response key.');
    const pending = this.pendingInvites.get(payload.id);
    if (!pending) throw new Error('This response key does not match any pending invite.');
    await pending.pc.setRemoteDescription(payload.sdp);
  }

  private wireGuestChannel(channel: RTCDataChannel, pc: RTCPeerConnection) {
    let participantId: string | undefined;

    pc.onconnectionstatechange = () => {
      if (!participantId) return;
      const s = pc.connectionState;
      this.setStatus(participantId, s === 'connected' ? 'connected' : s === 'failed' ? 'failed' : 'disconnected');
    };

    channel.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as ClientToHostMessage;
      if (msg.type === 'hello') {
        participantId = msg.id;
        const participant: Participant = {
          id: msg.id,
          name: msg.name,
          isHost: false,
          color: colorFor(this.state.participants.length),
        };
        this.state = {
          ...this.state,
          participants: [...this.state.participants, participant],
          intentions: { ...this.state.intentions, [participant.id]: {} },
          completions: { ...this.state.completions, [participant.id]: {} },
        };
        this.guestLinks.set(participant.id, { pc, channel });
        this.pendingInvites.delete(
          [...this.pendingInvites.entries()].find(([, v]) => v.pc === pc)?.[0] ?? ''
        );

        this.send(channel, { type: 'snapshot', state: this.state, selfId: participant.id });
        this.broadcast({ type: 'participant-joined', participant }, participant.id);
        this.notify();
        this.setStatus(participant.id, 'connected');
        return;
      }

      if (!participantId) return; // ignore messages before hello

      if (msg.type === 'set-name') {
        this.state = {
          ...this.state,
          participants: this.state.participants.map((p) =>
            p.id === participantId ? { ...p, name: msg.name } : p
          ),
        };
        this.broadcast({ type: 'name-updated', participantId, name: msg.name });
        this.notify();
      } else if (msg.type === 'set-intention') {
        this.applyIntention(participantId, msg.blockIndex, msg.text);
        this.broadcast({ type: 'intention-updated', participantId, blockIndex: msg.blockIndex, text: msg.text });
        this.notify();
      } else if (msg.type === 'set-completion') {
        this.applyCompletion(participantId, msg.blockIndex, msg.completion);
        this.broadcast({
          type: 'completion-updated',
          participantId,
          blockIndex: msg.blockIndex,
          completion: msg.completion,
        });
        this.notify();
      }
    };

    channel.onclose = () => {
      if (!participantId) return;
      this.setStatus(participantId, 'disconnected');
    };
  }

  private applyIntention(participantId: string, blockIndex: number, text: string) {
    this.state = {
      ...this.state,
      intentions: {
        ...this.state.intentions,
        [participantId]: { ...this.state.intentions[participantId], [blockIndex]: text },
      },
    };
  }

  private applyCompletion(participantId: string, blockIndex: number, completion: Completion | null) {
    const forParticipant = { ...(this.state.completions[participantId] ?? {}) };
    if (completion) {
      forParticipant[blockIndex] = completion;
    } else {
      delete forParticipant[blockIndex];
    }
    this.state = {
      ...this.state,
      completions: { ...this.state.completions, [participantId]: forParticipant },
    };
  }

  private send(channel: RTCDataChannel, msg: WireMessage) {
    if (channel.readyState === 'open') channel.send(JSON.stringify(msg));
  }

  private broadcast(msg: HostToClientMessage, exceptParticipantId?: string) {
    for (const [id, link] of this.guestLinks) {
      if (id === exceptParticipantId) continue;
      this.send(link.channel, msg);
    }
  }

  // ---------------------------------------------------------------------
  // Guest: join flow
  // ---------------------------------------------------------------------

  async createJoinResponse(inviteCode: string): Promise<string> {
    if (this.role !== 'guest') throw new Error('Only a guest can join via an invite');
    const payload = decodeSignal(inviteCode);
    if (payload.kind !== 'offer') throw new Error('That looks like a response key, not an invite.');

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      this.setStatus(this.selfId, s === 'connected' ? 'connected' : s === 'failed' ? 'failed' : 'disconnected');
    };

    pc.ondatachannel = (ev) => {
      this.hostChannel = ev.channel;
      this.wireHostChannel(ev.channel);
    };

    await pc.setRemoteDescription(payload.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGatheringComplete(pc);

    return encodeSignal({ v: 1, kind: 'answer', id: payload.id, sdp: pc.localDescription! });
  }

  private wireHostChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      const me = this.state.participants[0];
      this.send(channel, { type: 'hello', id: this.selfId, name: me?.name ?? 'Guest' });
    };

    channel.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as HostToClientMessage;
      switch (msg.type) {
        case 'snapshot':
          this.state = msg.state;
          this.notify();
          this.setStatus(this.selfId, 'connected');
          break;
        case 'participant-joined':
          this.state = { ...this.state, participants: [...this.state.participants, msg.participant] };
          this.notify();
          break;
        case 'participant-left':
          this.state = {
            ...this.state,
            participants: this.state.participants.filter((p) => p.id !== msg.participantId),
          };
          this.notify();
          break;
        case 'intention-updated':
          this.applyIntention(msg.participantId, msg.blockIndex, msg.text);
          this.notify();
          break;
        case 'completion-updated':
          this.applyCompletion(msg.participantId, msg.blockIndex, msg.completion);
          this.notify();
          break;
        case 'config-updated':
          this.state = { ...this.state, config: msg.config };
          this.notify();
          break;
        case 'name-updated':
          this.state = {
            ...this.state,
            participants: this.state.participants.map((p) =>
              p.id === msg.participantId ? { ...p, name: msg.name } : p
            ),
          };
          this.notify();
          break;
        case 'status-sync':
          this.statuses = msg.statuses;
          this.notifyStatus();
          break;
      }
    };

    channel.onclose = () => {
      this.setStatus(this.selfId, 'disconnected');
    };
  }

  // ---------------------------------------------------------------------
  // Shared editing API
  // ---------------------------------------------------------------------

  setIntention(blockIndex: number, text: string) {
    this.applyIntention(this.selfId, blockIndex, text);
    this.notify();
    if (this.role === 'host') {
      this.broadcast({ type: 'intention-updated', participantId: this.selfId, blockIndex, text });
    } else if (this.hostChannel) {
      this.send(this.hostChannel, { type: 'set-intention', blockIndex, text });
    }
  }

  setCompletion(blockIndex: number, completion: Completion | null) {
    this.applyCompletion(this.selfId, blockIndex, completion);
    this.notify();
    if (this.role === 'host') {
      this.broadcast({ type: 'completion-updated', participantId: this.selfId, blockIndex, completion });
    } else if (this.hostChannel) {
      this.send(this.hostChannel, { type: 'set-completion', blockIndex, completion });
    }
  }

  setName(name: string) {
    this.state = {
      ...this.state,
      participants: this.state.participants.map((p) => (p.id === this.selfId ? { ...p, name } : p)),
    };
    this.notify();
    if (this.role === 'host') {
      this.broadcast({ type: 'name-updated', participantId: this.selfId, name });
    } else if (this.hostChannel) {
      this.send(this.hostChannel, { type: 'set-name', name });
    }
  }

  /** Extends the schedule with more work/break rounds. Host-authoritative: guests can't call this. */
  addIterations(count: number) {
    if (this.role !== 'host') throw new Error('Only the host can extend the schedule');
    if (count <= 0) return;
    this.state = {
      ...this.state,
      config: { ...this.state.config, iterations: this.state.config.iterations + count },
    };
    this.notify();
    this.broadcast({ type: 'config-updated', config: this.state.config });
  }
}

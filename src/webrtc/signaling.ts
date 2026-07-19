export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface SignalPayload {
  v: 1;
  kind: 'offer' | 'answer';
  /** Correlates an answer back to the offer/RTCPeerConnection that produced it. */
  id: string;
  sdp: RTCSessionDescriptionInit;
}

/** Base64url-encodes a signal payload so it's safe to paste as text or drop in a URL fragment. */
export function encodeSignal(payload: SignalPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSignal(code: string): SignalPayload {
  let b64 = code.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const json = decodeURIComponent(escape(atob(b64)));
  const parsed = JSON.parse(json) as SignalPayload;
  if (parsed.v !== 1 || !parsed.sdp || !parsed.kind) {
    throw new Error('That code does not look like a valid invite/response key.');
  }
  return parsed;
}

/**
 * Manual (non-trickle) signaling needs every ICE candidate baked into the SDP text blob
 * before it's handed off, since there's no signaling server to relay candidates afterward.
 */
export function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(finish, 8000);
    function finish() {
      clearTimeout(timeout);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }
    function check() {
      if (pc.iceGatheringState === 'complete') finish();
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

export function randomId(): string {
  return crypto.randomUUID();
}

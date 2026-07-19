import { useState } from 'react';
import type { RoomController } from '../webrtc/RoomController';

interface InviteEntry {
  key: string;
  code: string;
  response: string;
  accepted: boolean;
  error?: string;
}

interface Props {
  controller: RoomController;
}

export function InvitePanel({ controller }: Props) {
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [open, setOpen] = useState(true);
  const [creating, setCreating] = useState(false);

  async function addInvite() {
    setCreating(true);
    try {
      const code = await controller.createInvite();
      setInvites((prev) => [...prev, { key: crypto.randomUUID(), code, response: '', accepted: false }]);
    } finally {
      setCreating(false);
    }
  }

  async function submitResponse(key: string) {
    const entry = invites.find((i) => i.key === key);
    if (!entry || !entry.response.trim()) return;
    try {
      await controller.acceptResponse(entry.response.trim());
      setInvites((prev) => prev.map((i) => (i.key === key ? { ...i, accepted: true, error: undefined } : i)));
    } catch (err) {
      setInvites((prev) =>
        prev.map((i) => (i.key === key ? { ...i, error: err instanceof Error ? err.message : String(err) } : i))
      );
    }
  }

  return (
    <div className="panel">
      <button type="button" className="panel__toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} Invite people
      </button>
      {open && (
        <div className="panel__body">
          <p className="muted small">
            Generate an invite code, send it to someone (chat, email, whatever), then paste the
            response key they send back to connect them.
          </p>
          <button type="button" className="btn" onClick={addInvite} disabled={creating}>
            {creating ? 'Generating…' : '+ New invite'}
          </button>
          {invites.map((invite) => {
            const link = `${location.origin}${location.pathname}#join=${invite.code}`;
            return (
            <div className="invite-entry" key={invite.key}>
              <label className="field">
                <span>Invite link {invite.accepted && '✅ connected'}</span>
                <div className="field-row">
                  <input className="code-box code-box--single" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => navigator.clipboard?.writeText(link)}
                  >
                    Copy link
                  </button>
                </div>
                <details>
                  <summary className="muted small">or copy the raw code</summary>
                  <textarea className="code-box" rows={3} readOnly value={invite.code} onFocus={(e) => e.currentTarget.select()} />
                </details>
              </label>
              {!invite.accepted && (
                <label className="field">
                  <span>Paste their response key</span>
                  <div className="field-row">
                    <textarea
                      className="code-box"
                      rows={3}
                      value={invite.response}
                      onChange={(e) =>
                        setInvites((prev) =>
                          prev.map((i) => (i.key === invite.key ? { ...i, response: e.target.value } : i))
                        )
                      }
                      placeholder="Paste response key…"
                    />
                    <button type="button" className="btn btn--primary" onClick={() => submitResponse(invite.key)}>
                      Connect
                    </button>
                  </div>
                  {invite.error && <p className="error">{invite.error}</p>}
                </label>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

interface Props {
  initialCode?: string;
  onSubmit: (opts: { guestName: string; inviteCode: string }) => Promise<void>;
  onBack: () => void;
}

export function JoinSetup({ initialCode, onSubmit, onBack }: Props) {
  const [guestName, setGuestName] = useState('');
  const [inviteCode, setInviteCode] = useState(initialCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const valid = guestName.trim().length > 0 && inviteCode.trim().length > 0;

  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || busy) return;
        setBusy(true);
        setError(undefined);
        try {
          await onSubmit({ guestName: guestName.trim(), inviteCode: inviteCode.trim() });
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          setBusy(false);
        }
      }}
    >
      <h2>Join a room</h2>
      <label className="field">
        <span>Your name</span>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Grace" autoFocus />
      </label>
      <label className="field">
        <span>Invite code from the host</span>
        <textarea
          className="code-box"
          rows={4}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Paste the invite code the host sent you…"
        />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="landing__actions">
        <button type="button" className="btn" onClick={onBack} disabled={busy}>
          Back
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valid || busy}>
          {busy ? 'Generating response…' : 'Generate response key'}
        </button>
      </div>
    </form>
  );
}

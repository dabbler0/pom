import { useState } from 'react';

interface Props {
  onSubmit: (opts: { hostName: string; workMinutes: number; breakMinutes: number; iterations: number }) => void;
  onBack: () => void;
}

export function HostSetup({ onSubmit, onBack }: Props) {
  const [hostName, setHostName] = useState('');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [iterations, setIterations] = useState(4);

  const valid = hostName.trim().length > 0 && workMinutes > 0 && breakMinutes > 0 && iterations > 0;

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ hostName: hostName.trim(), workMinutes, breakMinutes, iterations });
      }}
    >
      <h2>Host a room</h2>
      <label className="field">
        <span>Your name</span>
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Ada" autoFocus />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Work minutes</span>
          <input
            type="number"
            min={1}
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Break minutes</span>
          <input
            type="number"
            min={1}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Iterations</span>
          <input
            type="number"
            min={1}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="muted small">
        The schedule starts now: {iterations} × ({workMinutes}m work + {breakMinutes}m break).
      </p>
      <div className="landing__actions">
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn btn--primary" disabled={!valid}>
          Start room
        </button>
      </div>
    </form>
  );
}

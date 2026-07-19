interface Props {
  onHost: () => void;
  onJoin: () => void;
}

export function Landing({ onHost, onJoin }: Props) {
  return (
    <div className="card landing">
      <h1>🍅 pom</h1>
      <p className="muted">
        A serverless pomodoro tracker. Host a room to plan your work/break cycle, or join one a
        friend already started — no server involved, just a text handshake over WebRTC.
      </p>
      <div className="landing__actions">
        <button className="btn btn--primary" onClick={onHost}>
          Host a room
        </button>
        <button className="btn" onClick={onJoin}>
          Join a room
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';

interface Props {
  onAdd: (count: number) => void;
}

export function AddRoundsControl({ onAdd }: Props) {
  const [count, setCount] = useState(1);

  return (
    <div className="add-rounds">
      <span className="muted small">Running long?</span>
      <input
        type="number"
        min={1}
        value={count}
        onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
      />
      <button
        type="button"
        className="btn"
        onClick={() => onAdd(count)}
      >
        + Add {count === 1 ? 'a round' : `${count} rounds`}
      </button>
    </div>
  );
}

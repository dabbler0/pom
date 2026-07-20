import type { Completion } from '../types';

interface Props {
  value?: Completion;
  editable: boolean;
  onChange: (value: Completion | null) => void;
}

export function CompletionToggle({ value, editable, onChange }: Props) {
  if (!editable) {
    if (value === 'done') return <span className="completion-badge completion-badge--done">✓</span>;
    if (value === 'missed') return <span className="completion-badge completion-badge--missed">✕</span>;
    return null;
  }

  return (
    <span className="completion-toggle">
      <button
        type="button"
        className={`completion-btn completion-btn--done ${value === 'done' ? 'is-active' : ''}`}
        title="Mark this block done"
        aria-pressed={value === 'done'}
        onClick={() => onChange(value === 'done' ? null : 'done')}
      >
        ✓
      </button>
      <button
        type="button"
        className={`completion-btn completion-btn--missed ${value === 'missed' ? 'is-active' : ''}`}
        title="Mark this block missed"
        aria-pressed={value === 'missed'}
        onClick={() => onChange(value === 'missed' ? null : 'missed')}
      >
        ✕
      </button>
    </span>
  );
}

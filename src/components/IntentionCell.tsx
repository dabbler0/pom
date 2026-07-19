import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  editable: boolean;
  placeholder?: string;
  onChange?: (text: string) => void;
}

/** Debounces outgoing edits and avoids clobbering in-progress typing with incoming remote updates. */
export function IntentionCell({ value, editable, placeholder, onChange }: Props) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  if (!editable) {
    return value ? (
      <span className="cell-text">{value}</span>
    ) : (
      <span className="cell-text cell-text--empty">{placeholder}</span>
    );
  }

  return (
    <input
      className="cell-input"
      type="text"
      value={local}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setLocal(value);
      }}
      onChange={(e) => {
        const text = e.target.value;
        setLocal(text);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onChange?.(text), 200);
      }}
    />
  );
}

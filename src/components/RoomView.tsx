import { useState } from 'react';
import type { RoomController } from '../webrtc/RoomController';
import { useRoomState, useRoomStatuses } from '../state/useRoomController';
import { useNow } from '../state/useNow';
import { buildSchedule, currentBlock } from '../timer';
import { CountdownClock } from './CountdownClock';
import { ScheduleTable } from './ScheduleTable';
import { InvitePanel } from './InvitePanel';

interface Props {
  controller: RoomController;
  guestResponseCode?: string;
}

export function RoomView({ controller, guestResponseCode }: Props) {
  const state = useRoomState(controller);
  const statuses = useRoomStatuses(controller);
  const now = useNow();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const self = state.participants.find((p) => p.id === controller.selfId);
  const blocks = buildSchedule(state.config);
  const active = currentBlock(blocks, now);
  const scheduleDone = blocks.length > 0 && now >= blocks[blocks.length - 1].end;
  const connectedToHost = controller.role === 'host' || controller.getStatus(controller.selfId) === 'connected';

  return (
    <div className="room">
      <header className="room__header">
        <div>
          <h1>🍅 pom</h1>
          {editingName ? (
            <form
              className="name-edit"
              onSubmit={(e) => {
                e.preventDefault();
                if (nameDraft.trim()) controller.setName(nameDraft.trim());
                setEditingName(false);
              }}
            >
              <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              <button className="btn btn--small" type="submit">
                Save
              </button>
            </form>
          ) : (
            <p className="muted small">
              You're <strong style={{ color: self?.color }}>{self?.name}</strong>{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setNameDraft(self?.name ?? '');
                  setEditingName(true);
                }}
              >
                rename
              </button>
            </p>
          )}
        </div>
      </header>

      {controller.role === 'guest' && !connectedToHost && (
        <div className="panel panel--warn">
          <p>
            <strong>Waiting to connect…</strong> send this response key back to the host so they can
            finish connecting you.
          </p>
          <textarea className="code-box" rows={3} readOnly value={guestResponseCode} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}

      <CountdownClock block={active} now={now} scheduleDone={scheduleDone} />

      {controller.role === 'host' && <InvitePanel controller={controller} />}

      <ScheduleTable
        state={state}
        selfId={controller.selfId}
        statuses={statuses}
        now={now}
        onSetIntention={(blockIndex, text) => controller.setIntention(blockIndex, text)}
      />
    </div>
  );
}

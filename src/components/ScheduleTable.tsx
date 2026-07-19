import type { ConnectionStatus, RoomState } from '../types';
import { blockStatus, buildSchedule, formatClockTime } from '../timer';
import { IntentionCell } from './IntentionCell';

interface Props {
  state: RoomState;
  selfId: string;
  statuses: Record<string, ConnectionStatus>;
  now: number;
  onSetIntention: (blockIndex: number, text: string) => void;
}

export function ScheduleTable({ state, selfId, statuses, now, onSetIntention }: Props) {
  const blocks = buildSchedule(state.config);

  return (
    <div className="table-wrap">
      <table className="schedule">
        <thead>
          <tr>
            <th className="col-time">Time</th>
            <th className="col-kind">Block</th>
            {state.participants.map((p) => (
              <th key={p.id} style={{ color: p.color }}>
                <span className={`status-dot status-dot--${statuses[p.id] ?? 'disconnected'}`} title={statuses[p.id]} />
                {p.name}
                {p.id === selfId ? ' (you)' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => {
            const status = blockStatus(block, now);
            return (
              <tr key={block.index} className={`row row--${status} row--${block.kind}`}>
                <td className="col-time">{formatClockTime(block.start)}</td>
                <td className="col-kind">{block.kind === 'work' ? `Work ${block.cycle}` : `Break ${block.cycle}`}</td>
                {state.participants.map((p) => (
                  <td key={p.id}>
                    {block.kind === 'work' ? (
                      <IntentionCell
                        value={state.intentions[p.id]?.[block.index] ?? ''}
                        editable={p.id === selfId}
                        placeholder={p.id === selfId ? 'What will you work on?' : ''}
                        onChange={(text) => onSetIntention(block.index, text)}
                      />
                    ) : (
                      <span className="cell-text cell-text--muted">rest</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

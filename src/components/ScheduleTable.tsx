import type { Completion, ConnectionStatus, RoomState } from '../types';
import { blockStatus, buildSchedule, formatClockTime } from '../timer';
import { IntentionCell } from './IntentionCell';
import { CompletionToggle } from './CompletionToggle';

interface Props {
  state: RoomState;
  selfId: string;
  statuses: Record<string, ConnectionStatus>;
  now: number;
  onSetIntention: (blockIndex: number, text: string) => void;
  onSetCompletion: (blockIndex: number, completion: Completion | null) => void;
}

export function ScheduleTable({ state, selfId, statuses, now, onSetIntention, onSetCompletion }: Props) {
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
            const canMark = block.kind === 'work' && status !== 'future';
            return (
              <tr key={block.index} className={`row row--${status} row--${block.kind}`}>
                <td className="col-time">{formatClockTime(block.start)}</td>
                <td className="col-kind">{block.kind === 'work' ? `Work ${block.cycle}` : `Break ${block.cycle}`}</td>
                {state.participants.map((p) => {
                  const completion = state.completions[p.id]?.[block.index];
                  const isSelf = p.id === selfId;
                  return (
                    <td key={p.id}>
                      {block.kind === 'work' ? (
                        <div
                          className={`work-cell ${completion ? `work-cell--${completion}` : ''}`}
                        >
                          <IntentionCell
                            value={state.intentions[p.id]?.[block.index] ?? ''}
                            editable={isSelf}
                            placeholder={isSelf ? 'What will you work on?' : ''}
                            onChange={(text) => onSetIntention(block.index, text)}
                          />
                          {(canMark || completion) && (
                            <CompletionToggle
                              value={completion}
                              editable={isSelf && canMark}
                              onChange={(c) => onSetCompletion(block.index, c)}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="cell-text cell-text--muted">rest</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

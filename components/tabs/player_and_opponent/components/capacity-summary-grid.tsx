import type { CapacityBreakdown } from './battle-predictor';

interface CapacitySummaryGridProps {
  deployment: CapacityBreakdown;
  rally: CapacityBreakdown;
  showTemporary?: boolean;
}

export function CapacitySummaryGrid({ deployment, rally, showTemporary }: CapacitySummaryGridProps) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      <CapacityDetail title="Total Deployment Capacity" summary={deployment} showTemporary={showTemporary} />
      <CapacityDetail title="Total Rally Capacity" summary={rally} showTemporary={showTemporary} />
    </div>
  );
}

interface CapacityDetailProps {
  title: string;
  summary: CapacityBreakdown;
  showTemporary?: boolean;
}

function CapacityDetail({ title, summary, showTemporary }: CapacityDetailProps) {
  return (
    <div className="form-group">
      <label>{title}</label>
      <div
        style={{
          padding: '0.75rem',
          background: 'var(--card-alt-bg)',
          borderRadius: '4px',
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: 'var(--text)'
        }}
      >
        {summary.total.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        <div>
          <strong>Base (Permanent):</strong> {summary.base.toLocaleString()}
          {summary.manualOverride && <> (Manual Override)</>}
        </div>
        {!summary.manualOverride && summary.breakdown.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {summary.breakdown.map((entry) => (
              <li key={`${title}-${entry.label}`} className="flex justify-between gap-2">
                <span>{entry.label}:</span>
                <span>{entry.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        {!summary.manualOverride && showTemporary !== false && summary.temporary > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <strong>Temporary:</strong> {summary.temporary.toLocaleString()}
            {summary.temporaryBreakdown.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {summary.temporaryBreakdown.map((entry) => (
                  <li key={`${title}-temp-${entry.label}`} className="flex justify-between gap-2">
                    <span>{entry.label}:</span>
                    <span>{entry.value.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CapacitySummaryGrid;


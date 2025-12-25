import type { CapacityBreakdown } from '../../battle-predictor';

// ============================================================================
// Types
// ============================================================================

interface CapacitySummaryGridProps {
  deployment: CapacityBreakdown;
  rally: CapacityBreakdown;
  showTemporary?: boolean;
}

interface CapacityDetailProps {
  title: string;
  summary: CapacityBreakdown;
  showTemporary?: boolean;
}

// ============================================================================
// Components
// ============================================================================

export function CapacitySummaryGrid({ deployment, rally, showTemporary }: CapacitySummaryGridProps) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      <CapacityDetail title="Total Deployment Capacity" summary={deployment} showTemporary={showTemporary} />
      <CapacityDetail title="Total Rally Capacity" summary={rally} showTemporary={showTemporary} />
    </div>
  );
}

function CapacityDetail({ title, summary, showTemporary }: CapacityDetailProps) {
  const shouldShowTemporary = showTemporary !== false && summary.temporary > 0;

  return (
    <div className="form-group">
      <label>{title}</label>

      {/* Total Capacity Display */}
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

      {/* Breakdown Details */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        {/* Base (Permanent) Section */}
        <div>
          <strong>Base (Permanent):</strong> {summary.base.toLocaleString()}
          {summary.manualOverride && <> (Manual Override)</>}
        </div>

        {/* Base Breakdown */}
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

        {/* Temporary Section */}
        {!summary.manualOverride && shouldShowTemporary && (
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

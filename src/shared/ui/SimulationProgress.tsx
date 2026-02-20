'use client';

interface SimulationProgressProps {
  /** Number of simulations completed */
  current: number;
  /** Total number of simulations to run */
  total: number;
  /** Whether the simulation is currently running */
  isRunning: boolean;
}

/**
 * Progress bar component for Monte Carlo simulation runs.
 * Shows an animated progress bar with percentage and simulation count.
 * Collapses smoothly when not running.
 */
export default function SimulationProgress({
  current,
  total,
  isRunning,
}: SimulationProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Simulation progress: ${percent}%`}
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isRunning ? 'max-h-24 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
      }`}
    >
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
        {/* Label row */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className={`font-medium text-gray-700 dark:text-gray-300 ${isRunning ? 'animate-pulse' : ''}`}>
            Running {current.toLocaleString()} of {total.toLocaleString()} simulations&hellip;
          </span>
          <span className="tabular-nums font-semibold text-blue-600 dark:text-blue-400">
            {percent}%
          </span>
        </div>

        {/* Track */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {/* Fill — inline width is required because Tailwind cannot JIT arbitrary runtime values */}
          <div
            className={`h-full rounded-full transition-all duration-200 ease-out ${
              isRunning
                ? 'bg-linear-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500'
                : 'bg-blue-500 dark:bg-blue-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

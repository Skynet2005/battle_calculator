import { SEGMENTS_PER_STAR, STAR_COUNT } from './HeroSelector.utils';

export default function StarLevelPicker({
  starLevel,
  onSetStarLevel,
  onReset,
  disabled,
}: {
  starLevel: number;
  onSetStarLevel: (level: number) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-300 dark:text-gray-300">Star Level</span>

      <div className="star-level-input">
        {Array.from({ length: STAR_COUNT }, (_, starIdx) => {
          const starBase = starIdx * SEGMENTS_PER_STAR;

          return (
            <div
              key={`star-${starIdx}`}
              className="hex-star"
              role="group"
              aria-label={`Star ${starIdx + 1}`}
            >
              <svg viewBox="0 0 120 120" aria-hidden="true">
                {Array.from({ length: SEGMENTS_PER_STAR }, (_, segmentIdx) => {
                  const level = starBase + segmentIdx + 1;
                  const isActive = starLevel >= level;

                  return (
                    <path
                      key={level}
                      d="M60 8 L72 32 L60 56 L48 32 Z"
                      transform={`rotate(${-segmentIdx * 60} 60 60)`}
                      className={`hex-segment ${isActive ? 'active' : ''}`}
                      onClick={disabled ? undefined : () => onSetStarLevel(level)}
                      aria-label={`Set star level to ${level}`}
                    />
                  );
                })}
              </svg>
            </div>
          );
        })}

        <button
          type="button"
          className="star-reset"
          onClick={disabled ? undefined : onReset}
          aria-label="Reset star level"
          disabled={disabled}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

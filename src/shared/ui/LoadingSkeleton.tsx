'use client';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  showCard?: boolean;
}

export default function LoadingSkeleton({
  lines = 3,
  className = '',
  showCard = true
}: LoadingSkeletonProps) {
  const content = (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );

  if (showCard) {
    return <div className="card">{content}</div>;
  }

  return content;
}

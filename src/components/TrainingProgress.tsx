import type { TrackProgress } from "@/lib/trainingProgress";

/** Thin progress bar with a "n of N" label; `compact` drops the label for cards. */
export function TrainingProgressBar({ progress, compact = false }: { progress: TrackProgress; compact?: boolean }) {
  const pct = Math.round(progress.fraction * 100);
  return (
    <div className="space-y-1.5">
      {!compact && (
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-muted">
          <span>
            {progress.isComplete ? "Training complete" : `${progress.completed} of ${progress.total} sections`}
          </span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Training progress"
      >
        <div
          className={`h-full transition-[width] ${progress.isComplete ? "bg-success" : "bg-brand"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 6.5l2.6 2.5L10 3.5" />
    </svg>
  );
}

import type { TrainingProgressRow } from "./db";
import type { Track } from "./questions";
import { TRAINING } from "./training";

export interface TrackProgress {
  done: Set<string>;
  completed: number;
  total: number;
  /** 0..1 */
  fraction: number;
  isComplete: boolean;
  /** When the last section was completed, if the module is complete. */
  completedAt: Date | null;
  /** Index of the first section not yet done (or 0 when complete). */
  nextIndex: number;
}

/** Summarises raw progress rows for one track against the module's sections. */
export function trackProgress(rows: TrainingProgressRow[], track: Track): TrackProgress {
  const sections = TRAINING[track].sections;
  const mine = rows.filter((r) => r.track === track);
  const done = new Set(mine.map((r) => r.section));
  const completed = sections.filter((s) => done.has(s.slug)).length;
  const total = sections.length;
  const isComplete = completed === total;
  const completedAt = isComplete
    ? new Date(Math.max(...mine.filter((r) => sections.some((s) => s.slug === r.section)).map((r) => new Date(r.completed_at).getTime())))
    : null;
  const nextIndex = isComplete ? 0 : sections.findIndex((s) => !done.has(s.slug));
  return { done, completed, total, fraction: total ? completed / total : 0, isComplete, completedAt, nextIndex };
}

export function totalMinutes(track: Track): number {
  return TRAINING[track].sections.reduce((n, s) => n + s.minutes, 0);
}

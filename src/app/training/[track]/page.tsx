import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { auth } from "@/auth";
import { CheckIcon, TrainingProgressBar } from "@/components/TrainingProgress";
import { formatDate } from "@/lib/certificate";
import { trainingProgressForUser } from "@/lib/db";
import { isTrack, TRACKS } from "@/lib/questions";
import { TRAINING } from "@/lib/training";
import { totalMinutes, trackProgress } from "@/lib/trainingProgress";

/** Module overview: intro, progress tracker, and the list of sections. */
export default async function TrainingOverview(props: PageProps<"/training/[track]">) {
  const { track } = await props.params;
  if (!isTrack(track)) notFound();
  const locked = (await props.searchParams).locked !== undefined;
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/training/${track}`);
  const rows = await trainingProgressForUser(session.user.id);
  const progress = trackProgress(rows, track);
  const t = TRACKS[track];
  const mod = TRAINING[track];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="eyebrow">
          <span className="text-coral">{t.title}</span> track · training
        </p>
        <h1>{t.title} training</h1>
        <p className="max-w-prose text-body">{mod.intro}</p>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
          {mod.sections.length} sections · about {totalMinutes(track)} minutes · example questions come from the real quiz
        </p>
      </section>

      {locked && !progress.isComplete && (
        <p className="border border-coral/60 bg-surface-2 p-4 text-sm text-body" role="status">
          <span className="eyebrow text-coral">Quiz locked</span>
          <span className="mt-1 block">
            The {t.title} quiz unlocks once you have completed all {mod.sections.length} training sections below.
          </span>
        </p>
      )}

      <section className={`card space-y-4 ${progress.isComplete ? "border-success/60" : ""}`}>
        <TrainingProgressBar progress={progress} />
        {progress.isComplete ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success text-brand-ink">
                <CheckIcon />
              </span>
              Training completed{progress.completedAt ? ` on ${formatDate(progress.completedAt)}` : ""}. You are ready for the quiz.
            </p>
            <form action={startAttempt}>
              <input type="hidden" name="track" value={track} />
              <button className="btn-primary">Start the quiz</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-body">
              {progress.completed === 0
                ? "Not started yet. Work through the sections in order; each one ends with an example question or two."
                : `Pick up where you left off: section ${progress.nextIndex + 1}, ${mod.sections[progress.nextIndex].title}.`}
            </p>
            <Link href={`/training/${track}/${progress.nextIndex + 1}`} className="btn-primary">
              {progress.completed === 0 ? "Start training" : "Continue"}
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2>Sections</h2>
        <ol className="card divide-y divide-line p-0">
          {mod.sections.map((s, i) => {
            const done = progress.done.has(s.slug);
            return (
              <li key={s.slug}>
                <Link
                  href={`/training/${track}/${i + 1}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-2"
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border text-[11px] ${
                      done ? "border-success bg-success text-brand-ink" : "border-line-strong text-muted"
                    }`}
                    aria-label={done ? "Completed" : "Not completed"}
                  >
                    {done ? <CheckIcon /> : i + 1}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-[15px] ${done ? "text-body" : "text-foreground"}`}>{s.title}</span>
                    <span className="block text-[11px] uppercase tracking-[0.12em] text-muted">
                      {s.minutes} min · {s.practice.length} example {s.practice.length === 1 ? "question" : "questions"}
                    </span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-brand">{done ? "Review" : "Open"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

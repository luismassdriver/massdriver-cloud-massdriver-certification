import { auth } from "@/auth";
import { startAttempt } from "./actions";
import Link from "next/link";
import { CompletedBadge } from "@/components/CompletedBadge";
import { CheckIcon, LockIcon, TrainingProgressBar } from "@/components/TrainingProgress";
import { TrackCanvas } from "@/components/TrackCanvas";
import { certificatesForUser, trainingProgressForUser } from "@/lib/db";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS, type Track } from "@/lib/questions";
import { totalMinutes, trackProgress } from "@/lib/trainingProgress";

// Canvas order: Ops / Platform on the left provisions the platform the
// Developer track (right) deploys onto, so the connection runs ops → developer.
const CANVAS_ORDER: Track[] = ["ops", "developer"];

export default async function Home() {
  const session = await auth();
  // Tracks the signed-in user has already passed (any certificate counts).
  const userId = session?.user?.id;
  const [certs, progressRows] = userId
    ? await Promise.all([certificatesForUser(userId), trainingProgressForUser(userId)])
    : [[], []];
  const passed = new Set<Track>(certs.map((c) => c.track));

  const nodes = CANVAS_ORDER.map((track) => {
    const t = TRACKS[track];
    const done = passed.has(track);
    const training = trackProgress(progressRows, track);
    return {
      id: track,
      content: (
        <div className={`card relative flex flex-col gap-5 ${done ? "border-brand/60" : ""}`}>
          {done && <CompletedBadge className="-right-3 -top-4" />}
          <div>
            <p className={`eyebrow ${done ? "pr-20" : ""}`}>{t.audience}</p>
            <h2 className="mt-2">
              <span className="text-coral">{t.title}</span> track
            </h2>
            <p className="mt-3 text-sm text-body">{t.description}</p>
          </div>
          <div className="mt-auto space-y-3">
            <div className="space-y-2 border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em]">
                <span className="flex items-center gap-1.5 text-muted">
                  {training.isComplete && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success text-brand-ink">
                      <CheckIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {training.isComplete
                    ? "Training complete"
                    : training.completed > 0
                      ? `Training ${training.completed}/${training.total}`
                      : `Training · ${totalMinutes(track)} min`}
                </span>
                <Link
                  href={session?.user ? `/training/${track}${training.isComplete || training.completed === 0 ? "" : `/${training.nextIndex + 1}`}` : `/signin?callbackUrl=/training/${track}`}
                  className="text-brand transition hover:text-brand-hover"
                >
                  {training.isComplete ? "Review" : training.completed > 0 ? "Continue →" : "Start →"}
                </Link>
              </div>
              {session?.user && <TrainingProgressBar progress={training} compact />}
            </div>
            {session?.user && !training.isComplete ? (
              <button
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                disabled
                title="Finish the training to unlock the quiz"
              >
                <LockIcon />
                Training incomplete
              </button>
            ) : (
              <form action={startAttempt}>
                <input type="hidden" name="track" value={track} />
                <button className={`w-full ${done ? "btn-secondary" : "btn-primary"}`}>
                  {!session?.user ? "Sign in to start" : done ? "Take quiz again" : "Start quiz"}
                </button>
              </form>
            )}
          </div>
        </div>
      ),
    };
  });

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">/massdriver:certification</p>
        <h1>
          Get certified on <span className="text-brand">Massdriver</span>
        </h1>
        <p className="max-w-prose text-body">
          Two tracks, {QUESTIONS_PER_ATTEMPT} questions each, pass at {PASS_MARK}. Each track starts with a short training module that unlocks its quiz.
          Questions and answer order are shuffled every attempt, and every wrong
          answer shows the explanation, so the quiz teaches as you go. Pass and you
          get a certificate with a public verification link for your onboarding
          checklist.
        </p>
      </section>

      <section>
        <TrackCanvas nodes={nodes} edge={["ops", "developer"]} />
      </section>
    </div>
  );
}

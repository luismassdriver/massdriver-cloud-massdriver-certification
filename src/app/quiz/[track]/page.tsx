import Link from "next/link";
import { notFound } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { auth } from "@/auth";
import { trainingProgressForUser } from "@/lib/db";
import { isTrack, PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS } from "@/lib/questions";
import { totalMinutes, trackProgress } from "@/lib/trainingProgress";

export default async function QuizIntro(props: PageProps<"/quiz/[track]">) {
  const { track } = await props.params;
  if (!isTrack(track)) notFound();
  const t = TRACKS[track];
  const session = await auth();
  // The quiz is locked until the training for this track is complete.
  const progress = session?.user?.id
    ? trackProgress(await trainingProgressForUser(session.user.id), track)
    : null;
  const unlocked = progress?.isComplete ?? false;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p className="eyebrow">{t.audience}</p>
      <h1>{t.title} track</h1>
      <p className="text-body">{t.description}</p>
      <ul className="card list-disc space-y-1 pl-9 text-sm">
        <li>{QUESTIONS_PER_ATTEMPT} multiple-choice questions, one correct answer each.</li>
        <li>Pass at {PASS_MARK}/{QUESTIONS_PER_ATTEMPT}. Unanswered questions count as wrong.</li>
        <li>You see the explanation for every miss and can retry immediately.</li>
        <li>You need to complete the {t.title} training (about {totalMinutes(track)} minutes) before you can start.</li>
      </ul>
      {!session?.user ? (
        <form action={startAttempt}>
          <input type="hidden" name="track" value={track} />
          <button className="btn-primary">Sign in to start</button>
        </form>
      ) : unlocked ? (
        <form action={startAttempt}>
          <input type="hidden" name="track" value={track} />
          <button className="btn-primary">Start</button>
        </form>
      ) : (
        <div className="card space-y-3 border-coral/60">
          <p className="eyebrow text-coral">Quiz locked</p>
          <p className="text-sm text-body">
            {progress && progress.completed > 0
              ? `You have completed ${progress.completed} of ${progress.total} training sections. Finish the rest to unlock the quiz.`
              : "Work through the training first. It covers everything the quiz asks, and ends with the quiz."}
          </p>
          <Link
            href={`/training/${track}${progress && progress.completed > 0 ? `/${progress.nextIndex + 1}` : ""}`}
            className="btn-primary inline-block"
          >
            {progress && progress.completed > 0 ? "Continue training →" : "Start training →"}
          </Link>
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { isTrack, PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS } from "@/lib/questions";

export default async function QuizIntro(props: PageProps<"/quiz/[track]">) {
  const { track } = await props.params;
  if (!isTrack(track)) notFound();
  const t = TRACKS[track];
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{t.title} track</h1>
      <p className="text-muted">{t.description}</p>
      <ul className="card list-disc space-y-1 pl-9 text-sm">
        <li>{QUESTIONS_PER_ATTEMPT} multiple-choice questions, one correct answer each.</li>
        <li>Pass at {PASS_MARK}/{QUESTIONS_PER_ATTEMPT}. Unanswered questions count as wrong.</li>
        <li>You see the explanation for every miss and can retry immediately.</li>
      </ul>
      <form action={startAttempt}>
        <input type="hidden" name="track" value={track} />
        <button className="btn-primary">Start</button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { currentUserId } from "@/auth";
import { attemptById, certificateForAttempt } from "@/lib/db";
import { PASS_MARK, TRACKS } from "@/lib/questions";
import { grade } from "@/lib/quiz";

const LETTERS = ["A", "B", "C", "D"];

export default async function ResultPage(props: PageProps<"/attempt/[id]/result">) {
  const { id } = await props.params;
  const userId = await currentUserId();
  if (!userId) redirect(`/signin?callbackUrl=/attempt/${id}/result`);
  const attempt = await attemptById(id);
  if (!attempt || attempt.user_id !== userId) notFound();
  if (!attempt.submitted_at) redirect(`/attempt/${id}`);

  const result = grade(attempt.layout, attempt.answers ?? {});
  const cert = result.passed ? await certificateForAttempt(id) : null;
  const misses = result.questions.filter((q) => !q.isCorrect);

  return (
    <div className="space-y-8">
      <section className={`card border-2 ${result.passed ? "border-success" : "border-danger"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {TRACKS[attempt.track].title} track
        </p>
        <h1 className="mt-1 text-3xl font-semibold">
          {result.score}/{result.total} — {result.passed ? "Passed" : "Not yet"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {result.passed
            ? "Your certificate is ready. The verification link is public and safe to put in an onboarding checklist."
            : `You need ${PASS_MARK} to pass. Review the explanations below, then try again — the questions and answer order are reshuffled.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {cert && (
            <>
              <Link href={`/cert/${cert.id}`} className="btn-primary">
                View certificate
              </Link>
              <a href={`/cert/${cert.id}/pdf`} className="btn-secondary">
                Download PDF
              </a>
            </>
          )}
          <form action={startAttempt}>
            <input type="hidden" name="track" value={attempt.track} />
            <button className={result.passed ? "btn-secondary" : "btn-primary"}>
              {result.passed ? "Take again" : "Retry now"}
            </button>
          </form>
          <Link href="/me" className="btn-secondary">
            My results
          </Link>
        </div>
      </section>

      {misses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Review ({misses.length} {misses.length === 1 ? "miss" : "misses"})
          </h2>
          {misses.map((q) => (
            <div key={q.id} className="card space-y-3">
              <p className="font-medium">
                <span className="mr-2 text-brand">{q.number}.</span>
                {q.prompt}
              </p>
              <ul className="space-y-1 text-sm">
                {q.options.map((opt, i) => {
                  const isRight = i === q.correct;
                  const isChosen = i === q.chosen;
                  return (
                    <li
                      key={i}
                      className={`rounded-lg border p-2 ${
                        isRight
                          ? "border-success bg-success/10"
                          : isChosen
                            ? "border-danger bg-danger/10"
                            : "border-line"
                      }`}
                    >
                      <span className="mr-2 font-mono text-muted">{LETTERS[i]}.</span>
                      {opt}
                      {isRight && <span className="ml-2 text-xs font-semibold text-success">correct</span>}
                      {isChosen && !isRight && (
                        <span className="ml-2 text-xs font-semibold text-danger">your answer</span>
                      )}
                    </li>
                  );
                })}
                {q.chosen === null && (
                  <li className="text-xs text-danger">Not answered.</li>
                )}
              </ul>
              <p className="rounded-lg bg-background p-3 text-sm">
                <span className="font-semibold">Why: </span>
                {q.rationale}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

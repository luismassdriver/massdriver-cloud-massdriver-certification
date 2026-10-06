import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { auth } from "@/auth";
import { Celebration } from "@/components/Celebration";
import { CertificateCard } from "@/components/CertificateCard";
import { ShareButtons } from "@/components/ShareButtons";
import { attemptById, certificateForAttempt } from "@/lib/db";
import { PASS_MARK, TRACKS } from "@/lib/questions";
import { grade } from "@/lib/quiz";
import { publicOrigin } from "@/lib/url";

const LETTERS = ["A", "B", "C", "D"];

export default async function ResultPage(props: PageProps<"/attempt/[id]/result">) {
  const { id } = await props.params;
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (!userId) redirect(`/signin?callbackUrl=/attempt/${id}/result`);
  const attempt = await attemptById(id);
  if (!attempt || attempt.user_id !== userId) notFound();
  if (!attempt.submitted_at) redirect(`/attempt/${id}`);

  const result = grade(attempt.layout, attempt.answers ?? {});
  const cert = result.passed ? await certificateForAttempt(id) : null;
  const misses = result.questions.filter((q) => !q.isCorrect);
  const track = TRACKS[attempt.track];
  const displayName = session?.user?.name ?? session?.user?.email ?? "Certified Engineer";
  const firstName = displayName.split(/[\s@]/)[0];
  const origin = await publicOrigin();
  const verifyUrl = cert ? `${origin}/cert/${cert.id}` : "";

  return (
    <div className="space-y-8">
      {result.passed && cert ? (
        <>
          <Celebration />
          <section className="pass-hero">
            <div className="pass-badge" aria-hidden>
              <span className="pass-badge-ring" />
              <span className="pass-badge-core">
                {result.score}
                <small>/{result.total}</small>
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              {track.title} track · Passed
            </p>
            <h1 className="pass-title mt-2">Congratulations, {firstName}!</h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted">
              You{"'"}re now <strong className="text-foreground">Massdriver {track.title} certified</strong>.
              {result.score === result.total
                ? " A perfect score — not a single miss."
                : ` ${result.score} of ${result.total} correct${misses.length ? ", with explanations for the rest below" : ""}.`}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={`/cert/${cert.id}/pdf`} className="btn-primary">
                Download certificate (PDF)
              </a>
              <Link href={`/cert/${cert.id}`} className="btn-secondary">
                Open verification page
              </Link>
            </div>
            <div className="mt-3 flex justify-center">
              <ShareButtons
                url={verifyUrl}
                title={`I just earned the Massdriver ${track.title} certification`}
              />
            </div>
            <p className="mt-4 text-xs text-muted">
              The verification link is public and safe to put in an onboarding checklist or on your profile.
            </p>
          </section>

          <section>
            <CertificateCard
              name={displayName}
              track={attempt.track}
              score={result.score}
              issuedAt={new Date(cert.issued_at)}
              id={cert.id}
            />
          </section>

          <section className="flex flex-wrap justify-center gap-3">
            <form action={startAttempt}>
              <input type="hidden" name="track" value={attempt.track} />
              <button className="btn-secondary">Take again</button>
            </form>
            <Link href="/me" className="btn-secondary">
              My results
            </Link>
          </section>
        </>
      ) : (
        <section className="card border-2 border-danger">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {track.title} track
          </p>
          <h1 className="mt-1 text-3xl font-semibold">
            {result.score}/{result.total} — Not yet
          </h1>
          <p className="mt-2 text-sm text-muted">
            You need {PASS_MARK} to pass. Review the explanations below, then try again — the
            questions and answer order are reshuffled.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={startAttempt}>
              <input type="hidden" name="track" value={attempt.track} />
              <button className="btn-primary">Retry now</button>
            </form>
            <Link href="/me" className="btn-secondary">
              My results
            </Link>
          </div>
        </section>
      )}

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

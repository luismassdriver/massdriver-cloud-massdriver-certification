import Link from "next/link";
import { redirect } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { auth } from "@/auth";
import { LinkedInButtons } from "@/components/LinkedInButtons";
import { MassdriverLogo } from "@/components/MassdriverLogo";
import { CheckIcon, LockIcon, TrainingProgressBar } from "@/components/TrainingProgress";
import { formatDate } from "@/lib/certificate";
import { latestCertificatePerTrack } from "@/lib/certificates";
import { attemptsForUser, certificatesForUser, trainingProgressForUser } from "@/lib/db";
import { TRACKS, type Track } from "@/lib/questions";
import { totalMinutes, trackProgress } from "@/lib/trainingProgress";
import { publicOrigin } from "@/lib/url";

const TRACK_ORDER: Track[] = ["developer", "ops"];

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/me");
  const [attempts, certs, progressRows] = await Promise.all([
    attemptsForUser(session.user.id),
    certificatesForUser(session.user.id),
    trainingProgressForUser(session.user.id),
  ]);
  const latest = latestCertificatePerTrack(certs);
  const origin = await publicOrigin();

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1>Certificates</h1>
          <p className="mt-2 text-sm text-body">
            Your current certificate for each track. Earlier passes stay in the attempt history below.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {TRACK_ORDER.map((track) => {
            const entry = latest[track];
            const t = TRACKS[track];
            if (!entry) {
              return (
                <li key={track} className="card flex flex-col gap-2 border-dashed">
                  <p className="eyebrow-muted">{t.title}</p>
                  <p className="text-lg text-foreground">Not earned yet</p>
                  <p className="text-sm text-muted">{t.description}</p>
                  {trackProgress(progressRows, track).isComplete ? (
                    <form action={startAttempt} className="pt-1">
                      <input type="hidden" name="track" value={track} />
                      <button className="btn-secondary">Start quiz</button>
                    </form>
                  ) : (
                    <p className="inline-flex items-center gap-2 pt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                      <LockIcon />
                      Training incomplete
                    </p>
                  )}
                </li>
              );
            }
            const c = entry.latest;
            return (
              <li key={track} className="card flex flex-col gap-2 border-brand/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-coral">{t.title}</p>
                    <p className="text-lg text-foreground">Massdriver {t.title} Certification</p>
                  </div>
                  <MassdriverLogo markOnly className="h-8 shrink-0 text-brand" />
                </div>
                <p className="text-sm text-muted">
                  Issued {formatDate(new Date(c.issued_at))}
                  {entry.count > 1 && ` · latest of ${entry.count}`}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a href={`/cert/${c.id}/pdf`} className="btn-primary">
                    Download PDF
                  </a>
                  <Link href={`/cert/${c.id}`} className="btn-secondary">
                    Verification page
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkedInButtons
                    track={track}
                    issuedAt={new Date(c.issued_at)}
                    certId={c.id}
                    verifyUrl={`${origin}/cert/${c.id}`}
                    size="sm"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Training</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {TRACK_ORDER.map((track) => {
            const t = TRACKS[track];
            const p = trackProgress(progressRows, track);
            return (
              <li key={track} className={`card flex flex-col gap-3 ${p.isComplete ? "border-success/60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow-muted">{t.title}</p>
                    <p className="flex items-center gap-2 text-lg text-foreground">
                      {p.isComplete && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success text-brand-ink">
                          <CheckIcon />
                        </span>
                      )}
                      {p.isComplete ? "Training complete" : p.completed > 0 ? "In progress" : "Not started"}
                    </p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted">{totalMinutes(track)} min</span>
                </div>
                <TrainingProgressBar progress={p} />
                {p.isComplete && p.completedAt && (
                  <p className="text-sm text-muted">Completed {formatDate(p.completedAt)}</p>
                )}
                <div className="pt-1">
                  <Link
                    href={p.isComplete || p.completed === 0 ? `/training/${track}` : `/training/${track}/${p.nextIndex + 1}`}
                    className="btn-secondary"
                  >
                    {p.isComplete ? "Review training" : p.completed > 0 ? "Continue training" : "Start training"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Attempts</h2>
        {attempts.length === 0 ? (
          <p className="text-muted">No attempts yet.</p>
        ) : (
          <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-4 py-3 text-foreground">{TRACKS[a.track].title}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(new Date(a.started_at))}</td>
                  <td className="px-4 py-3">
                    {a.submitted_at ? (
                      <span className={a.passed ? "text-success" : "text-danger"}>
                        {a.score}/20 {a.passed ? "pass" : "fail"}
                      </span>
                    ) : (
                      <span className="text-muted">in progress</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={a.submitted_at ? `/attempt/${a.id}/result` : `/attempt/${a.id}`}
                      className="text-brand hover:underline"
                    >
                      {a.submitted_at ? "Review" : "Continue"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  );
}

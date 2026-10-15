import Link from "next/link";
import { redirect } from "next/navigation";
import { startAttempt } from "@/app/actions";
import { auth } from "@/auth";
import { MassdriverLogo } from "@/components/MassdriverLogo";
import { formatDate } from "@/lib/certificate";
import { latestCertificatePerTrack } from "@/lib/certificates";
import { attemptsForUser, certificatesForUser } from "@/lib/db";
import { TRACKS, type Track } from "@/lib/questions";

const TRACK_ORDER: Track[] = ["developer", "ops"];

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/me");
  const [attempts, certs] = await Promise.all([
    attemptsForUser(session.user.id),
    certificatesForUser(session.user.id),
  ]);
  const latest = latestCertificatePerTrack(certs);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Certificates</h1>
          <p className="text-sm text-muted">
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.title}</p>
                  <p className="font-semibold">Not earned yet</p>
                  <p className="text-sm text-muted">{t.description}</p>
                  <form action={startAttempt} className="pt-1">
                    <input type="hidden" name="track" value={track} />
                    <button className="btn-secondary">Start quiz</button>
                  </form>
                </li>
              );
            }
            const c = entry.latest;
            return (
              <li key={track} className="card flex flex-col gap-2 border-brand/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t.title}</p>
                    <p className="font-semibold">Massdriver {t.title} Certification</p>
                  </div>
                  <MassdriverLogo markOnly className="h-8 shrink-0 text-muted" />
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
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Attempts</h2>
        {attempts.length === 0 ? (
          <p className="text-muted">No attempts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2">Track</th>
                <th className="py-2">Started</th>
                <th className="py-2">Score</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="py-2">{TRACKS[a.track].title}</td>
                  <td className="py-2 text-muted">{formatDate(new Date(a.started_at))}</td>
                  <td className="py-2">
                    {a.submitted_at ? (
                      <span className={a.passed ? "text-success" : "text-danger"}>
                        {a.score}/20 {a.passed ? "pass" : "fail"}
                      </span>
                    ) : (
                      <span className="text-muted">in progress</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
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
        )}
      </section>
    </div>
  );
}

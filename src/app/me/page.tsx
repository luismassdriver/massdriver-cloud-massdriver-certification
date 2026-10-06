import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatDate } from "@/lib/certificate";
import { attemptsForUser, certificatesForUser } from "@/lib/db";
import { TRACKS } from "@/lib/questions";

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/me");
  const [attempts, certs] = await Promise.all([
    attemptsForUser(session.user.id),
    certificatesForUser(session.user.id),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Certificates</h1>
        {certs.length === 0 ? (
          <p className="text-muted">None yet. Pass a track to earn one.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {certs.map((c) => (
              <li key={c.id} className="card space-y-2">
                <p className="font-semibold">Massdriver {TRACKS[c.track].title}</p>
                <p className="text-sm text-muted">Issued {formatDate(new Date(c.issued_at))}</p>
                <div className="flex gap-3 pt-1">
                  <Link href={`/cert/${c.id}`} className="btn-secondary">
                    Verify link
                  </Link>
                  <a href={`/cert/${c.id}/pdf`} className="btn-primary">
                    PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
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

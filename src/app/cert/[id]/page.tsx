import { notFound } from "next/navigation";
import { formatDate } from "@/lib/certificate";
import { certificateById } from "@/lib/db";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS } from "@/lib/questions";
import { publicOrigin } from "@/lib/url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public verification page: no sign-in required, shows only name, track, score and date. */
export default async function CertificatePage(props: PageProps<"/cert/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const cert = await certificateById(id);
  if (!cert) notFound();
  const origin = await publicOrigin();
  const track = TRACKS[cert.track];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="card space-y-4 border-2 border-brand text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Verified certificate
        </p>
        <h1 className="text-2xl font-semibold">{cert.user_name ?? cert.user_email}</h1>
        <p>
          passed the <strong>Massdriver {track.title}</strong> certification
        </p>
        <p className="text-sm text-muted">
          Score {cert.score}/{QUESTIONS_PER_ATTEMPT} (pass mark {PASS_MARK}) · Issued{" "}
          {formatDate(new Date(cert.issued_at))}
        </p>
        <p className="font-mono text-xs text-muted">ID {cert.id}</p>
        <div className="flex justify-center gap-3 pt-2">
          <a href={`/cert/${cert.id}/pdf`} className="btn-primary">
            Download PDF
          </a>
        </div>
      </div>
      <p className="text-center text-xs text-muted">
        Verification link: {origin}/cert/{cert.id}
      </p>
    </div>
  );
}

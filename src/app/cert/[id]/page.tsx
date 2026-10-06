import { notFound } from "next/navigation";
import { CertificateCard } from "@/components/CertificateCard";
import { formatDate } from "@/lib/certificate";
import { certificateById } from "@/lib/db";
import { TRACKS } from "@/lib/questions";
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
  const name = cert.user_name ?? cert.user_email;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <span aria-hidden>✓</span> Verified by Massdriver Certification
          </p>
          <p className="mt-2 text-sm text-muted">
            {name} passed the {track.title} certification on {formatDate(new Date(cert.issued_at))}.
          </p>
        </div>
        <a href={`/cert/${cert.id}/pdf`} className="btn-primary">
          Download PDF
        </a>
      </div>

      <CertificateCard
        name={name}
        track={cert.track}
        score={cert.score}
        issuedAt={new Date(cert.issued_at)}
        id={cert.id}
      />

      <p className="text-center text-xs text-muted">
        Verification link: {origin}/cert/{cert.id}
      </p>
    </div>
  );
}

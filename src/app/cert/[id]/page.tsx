import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CertificateCard } from "@/components/CertificateCard";
import { LinkedInButtons } from "@/components/LinkedInButtons";
import { formatDate } from "@/lib/certificate";
import { certificateById } from "@/lib/db";
import { certificationName } from "@/lib/linkedin";
import { TRACKS } from "@/lib/questions";
import { publicOrigin } from "@/lib/url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Open Graph / Twitter tags so a LinkedIn (or Slack, X…) post of the
 * verification link unfurls as a certificate card. The image itself is
 * rendered by ./opengraph-image.tsx.
 */
export async function generateMetadata(props: PageProps<"/cert/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  if (!UUID.test(id)) return {};
  const cert = await certificateById(id);
  if (!cert) return {};
  const origin = await publicOrigin();
  const name = cert.user_name ?? cert.user_email;
  const title = `${name} · ${certificationName(cert.track)}`;
  const description = `${name} passed the Massdriver ${TRACKS[cert.track].title} certification on ${formatDate(new Date(cert.issued_at))}. Verified by Massdriver Certification.`;
  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/cert/${cert.id}`,
      siteName: "Massdriver Certification",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Public verification page: no sign-in required, shows only name, track and date. */
export default async function CertificatePage(props: PageProps<"/cert/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();
  const cert = await certificateById(id);
  if (!cert) notFound();
  const origin = await publicOrigin();
  const track = TRACKS[cert.track];
  const name = cert.user_name ?? cert.user_email;
  const verifyUrl = `${origin}/cert/${cert.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 border border-success/40 bg-success/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-success">
            <span aria-hidden>✓</span> Verified by Massdriver Certification
          </p>
          <p className="mt-2 text-sm text-body">
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
        issuedAt={new Date(cert.issued_at)}
        id={cert.id}
      />

      <div className="flex flex-wrap justify-center gap-2">
        <LinkedInButtons
          track={cert.track}
          issuedAt={new Date(cert.issued_at)}
          certId={cert.id}
          verifyUrl={verifyUrl}
        />
      </div>

      <p className="text-center text-xs text-muted">Verification link: {verifyUrl}</p>
    </div>
  );
}

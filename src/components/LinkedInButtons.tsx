import type { Track } from "@/lib/questions";
import { linkedInAddToProfileUrl } from "@/lib/linkedin";

/**
 * "Add to LinkedIn profile" opens LinkedIn's Licenses & certifications form
 * pre-filled from the certificate. Server component: a plain link, no JS.
 */
export function LinkedInButtons({
  track,
  issuedAt,
  certId,
  verifyUrl,
  size = "md",
}: {
  track: Track;
  issuedAt: Date;
  certId: string;
  verifyUrl: string;
  size?: "sm" | "md";
}) {
  const add = linkedInAddToProfileUrl({ track, issuedAt, certId, verifyUrl });
  const cls = size === "sm" ? "btn-secondary px-3 py-2" : "btn-secondary";
  return (
    <a href={add} target="_blank" rel="noreferrer" className={cls}>
      <LinkedInIcon />
      Add to LinkedIn profile
    </a>
  );
}

export function LinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

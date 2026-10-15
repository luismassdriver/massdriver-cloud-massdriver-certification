import { TRACKS, type Track } from "./questions";

export const ISSUER_NAME = "Massdriver";

export function certificationName(track: Track): string {
  return `Massdriver ${TRACKS[track].title} Certification`;
}

/**
 * LinkedIn's "Add to profile" deep link. Opens the Licenses & certifications
 * form on the member's own profile with every field pre-filled; they only
 * have to click Save. Documented by LinkedIn as the certification Add-to-Profile
 * URL (startTask=CERTIFICATION_NAME).
 */
export function linkedInAddToProfileUrl(opts: {
  track: Track;
  issuedAt: Date;
  certId: string;
  verifyUrl: string;
}): string {
  const p = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: certificationName(opts.track),
    organizationName: ISSUER_NAME,
    issueYear: String(opts.issuedAt.getUTCFullYear()),
    issueMonth: String(opts.issuedAt.getUTCMonth() + 1),
    certUrl: opts.verifyUrl,
    certId: opts.certId,
  });
  return `https://www.linkedin.com/profile/add?${p.toString()}`;
}

/** LinkedIn's share dialog for a URL; the post preview comes from the page's Open Graph tags. */
export function linkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

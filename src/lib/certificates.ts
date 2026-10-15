import type { Certificate } from "./db";
import type { Track } from "./questions";

export interface LatestCertificate {
  latest: Certificate;
  /** How many certificates this user has earned on the track, including the latest. */
  count: number;
}

/**
 * Collapse a user's certificates to the most recent one per track.
 * Input order does not matter; the newest `issued_at` wins.
 */
export function latestCertificatePerTrack(
  certs: Certificate[],
): Partial<Record<Track, LatestCertificate>> {
  const out: Partial<Record<Track, LatestCertificate>> = {};
  for (const c of certs) {
    const current = out[c.track];
    if (!current) {
      out[c.track] = { latest: c, count: 1 };
      continue;
    }
    current.count += 1;
    if (new Date(c.issued_at).getTime() > new Date(current.latest.issued_at).getTime()) {
      current.latest = c;
    }
  }
  return out;
}

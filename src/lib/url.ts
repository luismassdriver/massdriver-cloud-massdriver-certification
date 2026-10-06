import { headers } from "next/headers";

/** Public origin for links in PDFs and share text. Prefers APP_URL, falls back to the request host. */
export async function publicOrigin(): Promise<string> {
  const configured = process.env.APP_URL ?? process.env.AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

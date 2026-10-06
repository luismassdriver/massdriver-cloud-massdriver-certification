import { type NextRequest } from "next/server";
import { renderCertificatePdf } from "@/lib/certificate";
import { certificateById } from "@/lib/db";
import { publicOrigin } from "@/lib/url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, ctx: RouteContext<"/cert/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const cert = await certificateById(id);
  if (!cert) return new Response("Not found", { status: 404 });

  const origin = await publicOrigin();
  const pdf = await renderCertificatePdf({
    id: cert.id,
    name: cert.user_name ?? cert.user_email,
    track: cert.track,
    score: cert.score,
    issuedAt: new Date(cert.issued_at),
    verifyUrl: `${origin}/cert/${cert.id}`,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="massdriver-${cert.track}-certification.pdf"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}

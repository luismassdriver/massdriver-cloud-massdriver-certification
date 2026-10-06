import { ping } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + DB readiness. Kubernetes probes and the ALB health check hit this. */
export async function GET() {
  const db = await ping();
  return Response.json(
    { status: db ? "ok" : "degraded", db },
    { status: db ? 200 : 503 },
  );
}

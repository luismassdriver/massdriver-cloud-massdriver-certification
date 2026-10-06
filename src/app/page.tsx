import { auth } from "@/auth";
import { startAttempt } from "./actions";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS, type Track } from "@/lib/questions";

export default async function Home() {
  const session = await auth();
  const tracks = Object.keys(TRACKS) as Track[];
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Get certified on Massdriver
        </h1>
        <p className="max-w-prose text-muted">
          Two tracks, {QUESTIONS_PER_ATTEMPT} questions each, pass at {PASS_MARK}.
          Questions and answer order are shuffled every attempt, and every wrong
          answer shows the explanation, so the quiz teaches as you go. Pass and you
          get a certificate with a public verification link for your onboarding
          checklist.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {tracks.map((track) => {
          const t = TRACKS[track];
          return (
            <div key={track} className="card flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {t.audience}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{t.title} track</h2>
                <p className="mt-2 text-sm text-muted">{t.description}</p>
              </div>
              <form action={startAttempt} className="mt-auto">
                <input type="hidden" name="track" value={track} />
                <button className="btn-primary w-full">
                  {session?.user ? "Start quiz" : "Sign in to start"}
                </button>
              </form>
            </div>
          );
        })}
      </section>
    </div>
  );
}

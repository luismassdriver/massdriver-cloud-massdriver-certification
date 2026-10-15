import { auth } from "@/auth";
import { startAttempt } from "./actions";
import { CompletedBadge } from "@/components/CompletedBadge";
import { certificatesForUser } from "@/lib/db";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS, type Track } from "@/lib/questions";

export default async function Home() {
  const session = await auth();
  const tracks = Object.keys(TRACKS) as Track[];
  // Tracks the signed-in user has already passed (any certificate counts).
  const passed = new Set<Track>(
    session?.user?.id ? (await certificatesForUser(session.user.id)).map((c) => c.track) : [],
  );

  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <p className="eyebrow">/massdriver:certification</p>
        <h1>
          Get certified on <span className="text-brand">Massdriver</span>
        </h1>
        <p className="max-w-prose text-body">
          Two tracks, {QUESTIONS_PER_ATTEMPT} questions each, pass at {PASS_MARK}.
          Questions and answer order are shuffled every attempt, and every wrong
          answer shows the explanation, so the quiz teaches as you go. Pass and you
          get a certificate with a public verification link for your onboarding
          checklist.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {tracks.map((track) => {
          const t = TRACKS[track];
          const done = passed.has(track);
          return (
            <div
              key={track}
              className={`card relative flex flex-col gap-5 ${done ? "border-brand/60" : ""}`}
            >
              {done && <CompletedBadge className="-right-3 -top-4" />}
              <div>
                <p className={`eyebrow ${done ? "pr-20" : ""}`}>{t.audience}</p>
                <h2 className="mt-2">
                  <span className="text-coral">{t.title}</span> track
                </h2>
                <p className="mt-3 text-sm text-body">{t.description}</p>
              </div>
              <form action={startAttempt} className="mt-auto">
                <input type="hidden" name="track" value={track} />
                <button className={`w-full ${done ? "btn-secondary" : "btn-primary"}`}>
                  {!session?.user ? "Sign in to start" : done ? "Take quiz again" : "Start quiz"}
                </button>
              </form>
            </div>
          );
        })}
      </section>
    </div>
  );
}

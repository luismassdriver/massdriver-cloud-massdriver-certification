import { redirect } from "next/navigation";
import { auth, DEV_LOGIN_ENABLED, PROVIDER_IDS, signIn } from "@/auth";

const LABELS: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export default async function SignIn(props: PageProps<"/signin">) {
  const session = await auth();
  const { callbackUrl } = await props.searchParams;
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/";
  if (session?.user) redirect(target);

  // The dev provider reports Auth.js's default "credentials" id, so exclude both.
  const oauth = PROVIDER_IDS.filter((id) => id !== "dev" && id !== "credentials");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1>Sign in</h1>
      {oauth.length === 0 && !DEV_LOGIN_ENABLED && (
        <p className="card text-sm text-danger">
          No sign-in method is configured. Set AUTH_GOOGLE_ID/SECRET or
          AUTH_GITHUB_ID/SECRET, or AUTH_DEV_LOGIN=true for local development.
        </p>
      )}
      {oauth.map((id) => (
        <form
          key={id}
          action={async () => {
            "use server";
            await signIn(id, { redirectTo: target });
          }}
        >
          <button className="btn-secondary w-full">{LABELS[id] ?? `Continue with ${id}`}</button>
        </form>
      ))}
      {DEV_LOGIN_ENABLED && (
        <form
          className="card space-y-3"
          action={async (formData) => {
            "use server";
            await signIn("dev", {
              email: formData.get("email"),
              name: formData.get("name"),
              redirectTo: target,
            });
          }}
        >
          <p className="eyebrow text-danger">
            Dev login — no password, non-production only
          </p>
          <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">
            Email
            <input
              name="email"
              type="email"
              required
              className="input"
            />
          </label>
          <label className="block text-[11px] uppercase tracking-[0.12em] text-muted">
            Name
            <input
              name="name"
              type="text"
              className="input"
            />
          </label>
          <button className="btn-primary w-full">Sign in</button>
        </form>
      )}
    </div>
  );
}

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

  const oauth = PROVIDER_IDS.filter((id) => id !== "dev");

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-danger">
            Dev login — no password, non-production only
          </p>
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Name
            <input
              name="name"
              type="text"
              className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>
          <button className="btn-primary w-full">Sign in</button>
        </form>
      )}
    </div>
  );
}

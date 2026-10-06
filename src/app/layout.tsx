import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Massdriver Certification",
  description:
    "Developer and Ops/Platform certification quizzes for Massdriver. 20 questions, pass at 16.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="text-brand">▲</span> Massdriver Certification
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {session?.user ? (
                <>
                  <Link href="/me" className="hover:text-brand">
                    My results
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="text-muted hover:text-brand">Sign out</button>
                  </form>
                </>
              ) : (
                <Link href="/signin" className="hover:text-brand">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line py-4 text-center text-xs text-muted">
          Pass mark 16/20 · retry any time · explanations shown on every miss
        </footer>
      </body>
    </html>
  );
}

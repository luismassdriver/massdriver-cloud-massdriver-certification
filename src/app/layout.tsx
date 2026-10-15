import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { MassdriverLogo } from "@/components/MassdriverLogo";
import { THEME_KEY, ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

// Self-hosted so the build never depends on Google Fonts being reachable.
const jetbrains = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/JetBrainsMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/JetBrainsMono-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});
const bebas = localFont({
  src: "./fonts/BebasNeue-Regular.woff2",
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Massdriver Certification",
  description:
    "Developer and Ops/Platform certification quizzes for Massdriver. 20 questions, pass at 16.",
};

// Runs before first paint so the page never flashes the wrong theme.
// Order: saved choice → OS preference → dark (Massdriver's default).
const themeScript = `(function(){try{var k=${JSON.stringify(THEME_KEY)};var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`h-full antialiased ${jetbrains.variable} ${bebas.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3 text-foreground">
              <MassdriverLogo className="h-6" />
              <span className="hidden text-line-strong sm:inline" aria-hidden>
                /
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-body sm:inline">
                Certification
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-[11px] font-medium uppercase tracking-[0.12em]">
              {session?.user ? (
                <>
                  <Link href="/me" className="text-body transition hover:text-brand">
                    My results
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="uppercase tracking-[0.12em] text-muted transition hover:text-brand">Sign out</button>
                  </form>
                </>
              ) : (
                <Link href="/signin" className="text-body transition hover:text-brand">
                  Sign in
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t border-line bg-background/95 py-4 text-center text-[11px] uppercase tracking-[0.12em] text-muted">
          Pass mark 16/20 · retry any time · explanations on every miss
        </footer>
      </body>
    </html>
  );
}

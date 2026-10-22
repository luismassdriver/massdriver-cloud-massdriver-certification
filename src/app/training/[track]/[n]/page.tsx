import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { completeTrainingSection } from "@/app/actions";
import { auth } from "@/auth";
import { SectionExamples } from "@/components/SectionExamples";
import { CheckIcon, TrainingProgressBar } from "@/components/TrainingProgress";
import { trainingProgressForUser } from "@/lib/db";
import { isTrack, questionById, TRACKS } from "@/lib/questions";
import { TRAINING } from "@/lib/training";
import { trackProgress } from "@/lib/trainingProgress";

/** Renders **bold** spans and `code` spans inside a paragraph. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`")) return <code key={i} className="bg-surface-2 px-1 text-[13px] text-foreground">{p.slice(1, -1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export default async function TrainingSectionPage(props: PageProps<"/training/[track]/[n]">) {
  const { track, n } = await props.params;
  if (!isTrack(track)) notFound();
  const index = Number(n) - 1;
  const sections = TRAINING[track].sections;
  const section = Number.isInteger(index) ? sections[index] : undefined;
  if (!section) notFound();
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/training/${track}/${n}`);
  const progress = trackProgress(await trainingProgressForUser(session.user.id), track);
  const done = progress.done.has(section.slug);
  const t = TRACKS[track];
  const isLast = index === sections.length - 1;
  const questions = section.practice.map(questionById).filter((q) => q !== undefined);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em]">
          <Link href={`/training/${track}`} className="text-muted transition hover:text-brand">
            ← {t.title} training
          </Link>
          <span className="text-muted">
            Section {index + 1} of {sections.length} · {section.minutes} min
          </span>
        </div>
        <TrainingProgressBar progress={progress} compact />
      </div>

      <section className="space-y-4">
        <p className="eyebrow">
          <span className="text-coral">{t.title}</span> · section {index + 1}
        </p>
        <h1 className="flex items-start gap-3">
          {done && (
            <span className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-brand-ink" title="Completed">
              <CheckIcon />
            </span>
          )}
          <span>{section.title}</span>
        </h1>
        <div className="max-w-prose space-y-4 text-[15px] leading-7 text-body">
          {section.body.map((para, i) => (
            <p key={i}>
              <Rich text={para} />
            </p>
          ))}
        </div>
      </section>

      <figure className="card space-y-3 p-3">
        <Image
          src={section.screenshot.src}
          alt={section.screenshot.alt}
          width={1200}
          height={700}
          className="h-auto w-full border border-line"
          sizes="(max-width: 768px) 100vw, 736px"
        />
        <figcaption className="px-1 text-xs text-muted">{section.screenshot.caption}</figcaption>
      </figure>

      <SectionExamples
        questions={questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          correct: q.correct,
          rationale: q.rationale,
        }))}
        track={track}
        index={index}
        done={done}
        isLast={isLast}
        prevHref={index > 0 ? `/training/${track}/${index}` : null}
        action={completeTrainingSection}
      />
    </div>
  );
}

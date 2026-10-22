"use client";

import Link from "next/link";
import { useState } from "react";
import { PracticeQuestion } from "@/components/PracticeQuestion";

export type ExampleQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  rationale: string;
};

/**
 * The example questions of a training section plus the section footer.
 *
 * A section can only be marked complete once every example question has
 * been answered and checked. Getting one wrong is fine (the rationale is
 * the lesson); skipping is not. Sections that are already complete keep the
 * footer buttons as plain navigation.
 */
export function SectionExamples({
  questions,
  track,
  index,
  done,
  isLast,
  prevHref,
  action,
}: {
  questions: ExampleQuestion[];
  track: string;
  index: number;
  done: boolean;
  isLast: boolean;
  prevHref: string | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const allChecked = questions.every((q) => checked.includes(q.id));
  const canComplete = done || allChecked;
  const remaining = questions.length - checked.length;

  return (
    <>
      <section className="space-y-4">
        <h2>Example questions</h2>
        {questions.map((q, i) => (
          <PracticeQuestion
            key={q.id}
            number={i + 1}
            prompt={q.prompt}
            options={q.options}
            correct={q.correct}
            rationale={q.rationale}
            onChecked={() => setChecked((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]))}
          />
        ))}
      </section>

      <section className="space-y-3 border-t border-line pt-6">
        {!canComplete && (
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted" aria-live="polite">
            {remaining === questions.length
              ? `Answer and check ${questions.length === 1 ? "the example question" : `all ${questions.length} example questions`} above to mark this section complete.`
              : `${remaining} example ${remaining === 1 ? "question" : "questions"} left to check before you can mark this section complete.`}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {prevHref ? (
            <Link href={prevHref} className="btn-secondary">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <form action={action}>
            <input type="hidden" name="track" value={track} />
            <input type="hidden" name="index" value={index} />
            <input type="hidden" name="answered" value={checked.join(",")} />
            <button className="btn-primary" disabled={!canComplete}>
              {done ? (isLast ? "Back to overview" : "Next section →") : isLast ? "Mark complete & finish" : "Mark complete & continue →"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { submitAnswers } from "@/app/actions";
import type { Answers, PresentedQuestion } from "@/lib/quiz";

const LETTERS = ["A", "B", "C", "D"];

export function QuizForm({
  attemptId,
  questions,
}: {
  attemptId: string;
  questions: PresentedQuestion[];
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const answered = Object.keys(answers).length;
  const remaining = questions.length - answered;

  function submit() {
    setError(null);
    start(async () => {
      try {
        await submitAnswers(attemptId, answers);
      } catch (e) {
        // redirect() throws a special error that Next handles; anything else is real.
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-8">
      <ol className="space-y-8">
        {questions.map((q) => (
          <li key={q.id} className="card">
            <p className="mb-4 font-medium">
              <span className="mr-2 text-brand">{q.number}.</span>
              {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === i;
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                      selected
                        ? "border-brand bg-brand/10"
                        : "border-line hover:border-brand/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-0.5 accent-brand"
                      checked={selected}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    />
                    <span>
                      <span className="mr-2 font-mono text-muted">{LETTERS[i]}.</span>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {remaining === 0
              ? "All questions answered."
              : `${remaining} unanswered — they will count as wrong.`}
          </p>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={pending || answered === 0}
          >
            {pending ? "Grading…" : "Submit"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

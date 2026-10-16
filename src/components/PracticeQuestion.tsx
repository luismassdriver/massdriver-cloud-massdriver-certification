"use client";

import { useState } from "react";

const LETTERS = ["A", "B", "C", "D"];

/**
 * One practice question with instant feedback. Options are shown in the
 * order given (the quiz shuffles; training does not need to), the learner
 * picks one and checks it, and the rationale appears either way.
 */
export function PracticeQuestion({
  number,
  prompt,
  options,
  correct,
  rationale,
}: {
  number: number;
  prompt: string;
  options: string[];
  correct: number;
  rationale: string;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const isRight = checked && chosen === correct;

  return (
    <div className="card space-y-3">
      <p className="eyebrow-muted">Practice question {number}</p>
      <p className="text-[15px] text-foreground">{prompt}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const selected = chosen === i;
          let cls = "border-line hover:border-line-strong";
          if (checked) {
            if (i === correct) cls = "border-success bg-success/10";
            else if (selected) cls = "border-danger bg-danger/10";
            else cls = "border-line opacity-70";
          } else if (selected) cls = "border-brand bg-brand/10 text-foreground";
          return (
            <label key={i} className={`flex cursor-pointer gap-3 border p-3 text-sm transition ${cls}`}>
              <input
                type="radio"
                className="mt-0.5 accent-brand"
                checked={selected}
                disabled={checked}
                onChange={() => setChosen(i)}
              />
              <span>
                <span className="mr-2 font-mono text-muted">{LETTERS[i]}.</span>
                {opt}
                {checked && i === correct && <span className="ml-2 text-xs font-medium text-success">correct</span>}
                {checked && selected && i !== correct && (
                  <span className="ml-2 text-xs font-medium text-danger">your answer</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {!checked ? (
        <button type="button" className="btn-secondary" disabled={chosen === null} onClick={() => setChecked(true)}>
          Check answer
        </button>
      ) : (
        <div className="space-y-2">
          <p className={`text-[11px] font-medium uppercase tracking-[0.12em] ${isRight ? "text-success" : "text-danger"}`}>
            {isRight ? "Correct" : "Not quite"}
          </p>
          <p className="border-l-2 border-brand bg-surface-2 p-3 text-sm">
            <span className="font-medium text-foreground">Why: </span>
            {rationale}
          </p>
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.12em] text-muted transition hover:text-brand"
            onClick={() => {
              setChecked(false);
              setChosen(null);
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

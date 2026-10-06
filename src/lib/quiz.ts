import {
  PASS_MARK,
  QUESTIONS_PER_ATTEMPT,
  type Question,
  questionById,
  questionsForTrack,
  type Track,
} from "./questions";

/** Per-attempt layout: question order and, for each question, the option permutation. */
export interface Layout {
  /** Question ids in presentation order. */
  order: string[];
  /** questionId -> displayed option index -> canonical option index */
  options: Record<string, number[]>;
}

/** Answers keyed by question id, value = displayed option index (0..3). */
export type Answers = Record<string, number>;

export interface PresentedQuestion {
  id: string;
  number: number;
  prompt: string;
  options: string[];
}

export interface GradedQuestion extends PresentedQuestion {
  chosen: number | null;
  correct: number;
  isCorrect: boolean;
  rationale: string;
}

export interface GradeResult {
  score: number;
  total: number;
  passed: boolean;
  questions: GradedQuestion[];
}

/** mulberry32: small, deterministic, good enough for shuffling. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildLayout(track: Track, seed: number): Layout {
  const random = rng(seed);
  const qs = shuffle(questionsForTrack(track), random).slice(
    0,
    QUESTIONS_PER_ATTEMPT,
  );
  const options: Record<string, number[]> = {};
  for (const q of qs) {
    options[q.id] = shuffle([0, 1, 2, 3], random);
  }
  return { order: qs.map((q) => q.id), options };
}

function present(q: Question, layout: Layout, number: number): PresentedQuestion {
  const perm = layout.options[q.id];
  return {
    id: q.id,
    number,
    prompt: q.prompt,
    options: perm.map((canonical) => q.options[canonical]),
  };
}

/** Questions as the candidate sees them: shuffled, no answer data. */
export function presentQuestions(layout: Layout): PresentedQuestion[] {
  return layout.order.map((id, i) => {
    const q = questionById(id);
    if (!q) throw new Error(`Unknown question ${id}`);
    return present(q, layout, i + 1);
  });
}

export function grade(layout: Layout, answers: Answers): GradeResult {
  const questions: GradedQuestion[] = layout.order.map((id, i) => {
    const q = questionById(id);
    if (!q) throw new Error(`Unknown question ${id}`);
    const perm = layout.options[id];
    const displayedCorrect = perm.indexOf(q.correct);
    const chosenRaw = answers[id];
    const chosen =
      Number.isInteger(chosenRaw) && chosenRaw >= 0 && chosenRaw < 4
        ? chosenRaw
        : null;
    return {
      ...present(q, layout, i + 1),
      chosen,
      correct: displayedCorrect,
      isCorrect: chosen === displayedCorrect,
      rationale: q.rationale,
    };
  });
  const score = questions.filter((g) => g.isCorrect).length;
  return {
    score,
    total: questions.length,
    passed: score >= PASS_MARK,
    questions,
  };
}

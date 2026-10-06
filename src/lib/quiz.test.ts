import { describe, expect, it } from "vitest";
import { PASS_MARK, QUESTIONS, questionsForTrack } from "./questions";
import { buildLayout, grade, presentQuestions } from "./quiz";

describe("question bank", () => {
  it("has 20 questions per track with unique ids", () => {
    expect(questionsForTrack("developer")).toHaveLength(20);
    expect(questionsForTrack("ops")).toHaveLength(20);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("every question has 4 distinct options and a valid correct index", () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
      expect(q.rationale.length).toBeGreaterThan(10);
    }
  });
});

describe("layout", () => {
  it("is deterministic for a seed and covers every question once", () => {
    const a = buildLayout("developer", 42);
    const b = buildLayout("developer", 42);
    expect(a).toEqual(b);
    expect(new Set(a.order).size).toBe(20);
    for (const perm of Object.values(a.options)) {
      expect([...perm].sort()).toEqual([0, 1, 2, 3]);
    }
  });

  it("differs across seeds", () => {
    expect(buildLayout("ops", 1).order).not.toEqual(buildLayout("ops", 2).order);
  });

  it("presents options in shuffled order without leaking answers", () => {
    const layout = buildLayout("ops", 7);
    const presented = presentQuestions(layout);
    expect(presented).toHaveLength(20);
    for (const p of presented) {
      expect(Object.keys(p)).toEqual(["id", "number", "prompt", "options"]);
    }
  });
});

describe("grade", () => {
  it("scores a perfect attempt as 20/20 and passed", () => {
    const layout = buildLayout("developer", 3);
    const answers: Record<string, number> = {};
    for (const id of layout.order) {
      const q = QUESTIONS.find((x) => x.id === id)!;
      answers[id] = layout.options[id].indexOf(q.correct);
    }
    const result = grade(layout, answers);
    expect(result.score).toBe(20);
    expect(result.passed).toBe(true);
    expect(result.questions.every((g) => g.isCorrect)).toBe(true);
  });

  it("treats missing or out-of-range answers as wrong", () => {
    const layout = buildLayout("developer", 3);
    const result = grade(layout, { [layout.order[0]]: 9 });
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.questions[0].chosen).toBeNull();
  });

  it(`passes at exactly ${PASS_MARK}`, () => {
    const layout = buildLayout("ops", 11);
    const answers: Record<string, number> = {};
    layout.order.forEach((id, i) => {
      const q = QUESTIONS.find((x) => x.id === id)!;
      const right = layout.options[id].indexOf(q.correct);
      answers[id] = i < PASS_MARK ? right : (right + 1) % 4;
    });
    const result = grade(layout, answers);
    expect(result.score).toBe(PASS_MARK);
    expect(result.passed).toBe(true);
    answers[layout.order[0]] = (answers[layout.order[0]] + 1) % 4;
    expect(grade(layout, answers).passed).toBe(false);
  });
});

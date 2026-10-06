"use server";

import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import {
  attemptById,
  certificateForAttempt,
  createAttempt,
  issueCertificate,
  submitAttempt,
} from "@/lib/db";
import { isTrack } from "@/lib/questions";
import { type Answers, buildLayout, grade } from "@/lib/quiz";

export async function startAttempt(formData: FormData) {
  const track = String(formData.get("track") ?? "");
  if (!isTrack(track)) throw new Error("Unknown track");
  const userId = await currentUserId();
  if (!userId) redirect(`/signin?callbackUrl=/quiz/${track}`);
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const attempt = await createAttempt(userId, track, buildLayout(track, seed));
  redirect(`/attempt/${attempt.id}`);
}

export async function submitAnswers(attemptId: string, answers: Answers) {
  const userId = await currentUserId();
  if (!userId) redirect("/signin");
  const attempt = await attemptById(attemptId);
  if (!attempt || attempt.user_id !== userId) throw new Error("Attempt not found");
  if (attempt.submitted_at) redirect(`/attempt/${attemptId}/result`);

  // Only accept answers for questions in this attempt, as small integers.
  const clean: Answers = {};
  for (const id of attempt.layout.order) {
    const v = answers[id];
    if (Number.isInteger(v) && v >= 0 && v < 4) clean[id] = v;
  }

  const result = grade(attempt.layout, clean);
  const saved = await submitAttempt(attemptId, clean, result.score, result.passed);
  if (saved?.passed) {
    await issueCertificate(userId, attemptId, attempt.track);
  }
  redirect(`/attempt/${attemptId}/result`);
}

export async function certificateIdForAttempt(attemptId: string) {
  const cert = await certificateForAttempt(attemptId);
  return cert?.id ?? null;
}

"use server";

import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import {
  attemptById,
  certificateForAttempt,
  createAttempt,
  issueCertificate,
  markTrainingSectionComplete,
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

/** Marks a training section done and moves to the next one (or the module overview when it was the last). */
export async function completeTrainingSection(formData: FormData) {
  const track = String(formData.get("track") ?? "");
  const index = Number(formData.get("index"));
  if (!isTrack(track)) throw new Error("Unknown track");
  const { TRAINING } = await import("@/lib/training");
  const sections = TRAINING[track].sections;
  const section = sections[index];
  if (!section) throw new Error("Unknown section");
  const userId = await currentUserId();
  if (!userId) redirect(`/signin?callbackUrl=/training/${track}/${index + 1}`);
  await markTrainingSectionComplete(userId, track, section.slug);
  redirect(index + 1 < sections.length ? `/training/${track}/${index + 2}` : `/training/${track}`);
}

import { notFound, redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { QuizForm } from "@/components/QuizForm";
import { attemptById } from "@/lib/db";
import { TRACKS } from "@/lib/questions";
import { presentQuestions } from "@/lib/quiz";

export default async function AttemptPage(props: PageProps<"/attempt/[id]">) {
  const { id } = await props.params;
  const userId = await currentUserId();
  if (!userId) redirect(`/signin?callbackUrl=/attempt/${id}`);
  const attempt = await attemptById(id);
  if (!attempt || attempt.user_id !== userId) notFound();
  if (attempt.submitted_at) redirect(`/attempt/${id}/result`);

  const questions = presentQuestions(attempt.layout);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {TRACKS[attempt.track].title} track
        </p>
        <h1 className="text-2xl font-semibold">Certification quiz</h1>
      </div>
      <QuizForm attemptId={attempt.id} questions={questions} />
    </div>
  );
}

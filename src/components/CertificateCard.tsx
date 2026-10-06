import { MassdriverLogo } from "./MassdriverLogo";
import { formatDate } from "@/lib/certificate";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS, type Track } from "@/lib/questions";

export function CertificateCard({
  name,
  track,
  score,
  issuedAt,
  id,
}: {
  name: string;
  track: Track;
  score: number;
  issuedAt: Date;
  id: string;
}) {
  const t = TRACKS[track];
  return (
    <div className="certificate">
      <div className="certificate-inner">
        <div className="certificate-corner certificate-corner-tl" />
        <div className="certificate-corner certificate-corner-tr" />
        <div className="certificate-corner certificate-corner-bl" />
        <div className="certificate-corner certificate-corner-br" />

        <MassdriverLogo className="mx-auto h-9 text-[#111827]" />

        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#5b3df5]">
          Certificate of Achievement
        </p>
        <p className="mt-5 text-sm text-[#6b7280]">This certifies that</p>
        <h1 className="certificate-name mt-2 text-4xl sm:text-5xl">{name}</h1>
        <div className="mx-auto mt-4 h-px w-40 bg-[#c99e3b]" />
        <p className="mt-5 text-base text-[#111827]">
          has demonstrated proficiency in Massdriver and earned the
        </p>
        <p className="certificate-track mt-1 text-2xl text-[#111827]">
          {t.title} Certification
        </p>
        <p className="mt-1 text-xs italic text-[#6b7280]">{t.description}</p>

        <div className="mt-8 flex items-end justify-between gap-6 text-left">
          <div className="text-xs text-[#6b7280]">
            <p className="font-semibold uppercase tracking-wider text-[#111827]">Issued</p>
            <p>{formatDate(issuedAt)}</p>
            <p className="mt-2 font-semibold uppercase tracking-wider text-[#111827]">Score</p>
            <p>
              {score} / {QUESTIONS_PER_ATTEMPT} · pass mark {PASS_MARK}
            </p>
          </div>
          <div className="certificate-seal" aria-label="Certified seal">
            <MassdriverLogo markOnly className="h-9 text-[#111827]" />
            <span>Certified</span>
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] text-[#9ca3af]">Certificate ID {id}</p>
      </div>
    </div>
  );
}

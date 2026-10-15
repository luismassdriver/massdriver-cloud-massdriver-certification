import { MassdriverLogo } from "./MassdriverLogo";

/**
 * A "Certified" rosette pinned to a passed track card: the gold seal from the
 * certificate (rings, Massdriver mark, CERTIFIED) with two ribbon tails
 * hanging behind it. Absolutely positioned; the parent needs `relative`.
 * Styles live in globals.css under `.ribbon-seal*`.
 */
export function CompletedBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`ribbon-seal ${className}`} title="You have passed this track" aria-label="Certified">
      <span className="ribbon-seal-tail ribbon-seal-tail-left" aria-hidden />
      <span className="ribbon-seal-tail ribbon-seal-tail-right" aria-hidden />
      <span className="ribbon-seal-disc">
        <MassdriverLogo markOnly className="ribbon-seal-mark" title="" />
        <span className="ribbon-seal-text">Certified</span>
      </span>
    </div>
  );
}

import { LOGO_PATH, LOGO_VIEWBOX, MARK_VIEWBOX } from "@/lib/brand";

/** Inline logo so it follows `currentColor` (works in light and dark). */
export function MassdriverLogo({
  className = "h-6",
  markOnly = false,
  title = "Massdriver",
}: {
  className?: string;
  markOnly?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox={markOnly ? MARK_VIEWBOX : LOGO_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
    >
      <path fillRule="evenodd" clipRule="evenodd" d={LOGO_PATH} />
    </svg>
  );
}

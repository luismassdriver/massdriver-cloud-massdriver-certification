import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PASS_MARK, QUESTIONS_PER_ATTEMPT, TRACKS, type Track } from "./questions";

export interface CertificateData {
  id: string;
  name: string;
  track: Track;
  score: number;
  issuedAt: Date;
  verifyUrl: string;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function renderCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]); // US Letter, landscape
  const { width, height } = page.getSize();
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.357, 0.239, 0.961);
  const ink = rgb(0.07, 0.09, 0.15);
  const muted = rgb(0.42, 0.45, 0.5);

  // Frame
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: brand, borderWidth: 3 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: brand, borderWidth: 0.75 });

  const center = (text: string, y: number, font = sans, size = 12, color = ink) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  center("MASSDRIVER", height - 90, sansBold, 14, brand);
  center("Certificate of Completion", height - 150, serif, 40, ink);
  center("This certifies that", height - 200, sans, 13, muted);
  center(data.name, height - 245, serif, 30, ink);
  center(
    `has passed the Massdriver ${TRACKS[data.track].title} certification`,
    height - 285,
    sans,
    14,
    ink,
  );
  center(
    `Score ${data.score}/${QUESTIONS_PER_ATTEMPT} (pass mark ${PASS_MARK}) · Issued ${formatDate(data.issuedAt)}`,
    height - 310,
    sans,
    12,
    muted,
  );

  // Divider
  page.drawLine({ start: { x: width / 2 - 80, y: height - 345 }, end: { x: width / 2 + 80, y: height - 345 }, thickness: 1, color: brand });

  center("Verify this certificate", 120, sansBold, 10, muted);
  center(data.verifyUrl, 104, sans, 10, brand);
  center(`Certificate ID ${data.id}`, 80, sans, 9, muted);

  doc.setTitle(`Massdriver ${TRACKS[data.track].title} Certification — ${data.name}`);
  doc.setAuthor("Massdriver Certification");
  return doc.save();
}

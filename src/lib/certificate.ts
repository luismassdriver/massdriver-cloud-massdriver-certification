import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { BRAND, LOGO_PNG_BASE64, MARK_PNG_BASE64 } from "./brand";
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

/**
 * US Letter, landscape. Cream paper, purple outer rule with a hairline gold
 * inner rule and gold corner marks, the Massdriver logo at the top, a serif
 * name, and a gold seal carrying the mark. Everything is vector except the
 * logo, which is a high-resolution PNG.
 */
export async function renderCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]);
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const purple = rgb(BRAND.purple.r, BRAND.purple.g, BRAND.purple.b);
  const ink = rgb(BRAND.ink.r, BRAND.ink.g, BRAND.ink.b);
  const muted = rgb(BRAND.muted.r, BRAND.muted.g, BRAND.muted.b);
  const gold = rgb(BRAND.gold.r, BRAND.gold.g, BRAND.gold.b);
  const cream = rgb(BRAND.cream.r, BRAND.cream.g, BRAND.cream.b);
  const sealFill = rgb(0.97, 0.94, 0.86);

  // Paper, with a faint diagonal watermark underneath everything
  page.drawRectangle({ x: 0, y: 0, width, height, color: cream });
  page.drawText("MASSDRIVER CERTIFIED", {
    x: 175, y: 140, size: 54, font: sansBold, color: rgb(0.93, 0.91, 0.86), rotate: degrees(22), opacity: 0.18,
  });

  // Frame: purple rule, gold hairline, gold corner marks
  const m = 28;
  page.drawRectangle({ x: m, y: m, width: width - 2 * m, height: height - 2 * m, borderColor: purple, borderWidth: 2.5 });
  const g = m + 9;
  page.drawRectangle({ x: g, y: g, width: width - 2 * g, height: height - 2 * g, borderColor: gold, borderWidth: 0.6 });
  const c = 16;
  const corner = (x: number, y: number, dx: number, dy: number) => {
    page.drawLine({ start: { x, y }, end: { x: x + dx * c, y }, thickness: 1.4, color: gold });
    page.drawLine({ start: { x, y }, end: { x, y: y + dy * c }, thickness: 1.4, color: gold });
  };
  corner(g + 4, g + 4, 1, 1);
  corner(width - g - 4, g + 4, -1, 1);
  corner(g + 4, height - g - 4, 1, -1);
  corner(width - g - 4, height - g - 4, -1, -1);

  const center = (text: string, y: number, font = sans, size = 12, color = ink, tracking = 0) => {
    const w = font.widthOfTextAtSize(text, size) + tracking * (text.length - 1);
    let x = (width - w) / 2;
    if (tracking === 0) {
      page.drawText(text, { x, y, size, font, color });
      return;
    }
    for (const ch of text) {
      page.drawText(ch, { x, y, size, font, color });
      x += font.widthOfTextAtSize(ch, size) + tracking;
    }
  };

  // Logo
  const logo = await doc.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64"));
  const logoW = 190;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawImage(logo, { x: (width - logoW) / 2, y: height - 72 - logoH, width: logoW, height: logoH });

  // Headline
  center("CERTIFICATE OF ACHIEVEMENT", height - 150, sansBold, 11, purple, 4.5);
  center("This certifies that", height - 192, serifItalic, 15, muted);

  // Name, auto-shrunk to fit
  let nameSize = 40;
  while (serifBold.widthOfTextAtSize(data.name, nameSize) > width - 200 && nameSize > 22) nameSize -= 2;
  center(data.name, height - 238, serifBold, nameSize, ink);
  page.drawLine({
    start: { x: width / 2 - 110, y: height - 254 },
    end: { x: width / 2 + 110, y: height - 254 },
    thickness: 0.8,
    color: gold,
  });

  const track = TRACKS[data.track];
  center("has demonstrated proficiency in Massdriver and earned the", height - 284, serif, 14, ink);
  center(`${track.title} Certification`, height - 314, serifBold, 24, ink);
  center(track.description, height - 334, serifItalic, 11, muted);

  // Left block: issued + score
  const lx = 92;
  page.drawText("ISSUED", { x: lx, y: 186, size: 8, font: sansBold, color: ink });
  page.drawText(formatDate(data.issuedAt), { x: lx, y: 172, size: 11, font: serif, color: ink });
  page.drawText("SCORE", { x: lx + 150, y: 186, size: 8, font: sansBold, color: ink });
  page.drawText(`${data.score} of ${QUESTIONS_PER_ATTEMPT}  ·  pass mark ${PASS_MARK}`, {
    x: lx + 150, y: 172, size: 11, font: serif, color: ink,
  });
  // Signature-style line
  page.drawText("Massdriver", { x: lx, y: 122, size: 22, font: serifItalic, color: ink });
  page.drawLine({ start: { x: lx, y: 114 }, end: { x: lx + 220, y: 114 }, thickness: 0.6, color: gold });
  page.drawText("Massdriver Certification Program", { x: lx, y: 102, size: 8.5, font: sans, color: muted });

  // Seal (right): gold rings, cream fill, the mark, and "CERTIFIED" ribbon text
  const sx = width - 150;
  const sy = 140;
  page.drawCircle({ x: sx, y: sy, size: 52, color: sealFill, borderColor: gold, borderWidth: 2 });
  page.drawCircle({ x: sx, y: sy, size: 46, borderColor: gold, borderWidth: 0.6 });
  // Decorative ticks around the seal
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 49;
    const r2 = i % 3 === 0 ? 55 : 52;
    page.drawLine({
      start: { x: sx + Math.cos(a) * r1, y: sy + Math.sin(a) * r1 },
      end: { x: sx + Math.cos(a) * r2, y: sy + Math.sin(a) * r2 },
      thickness: 0.7,
      color: gold,
    });
  }
  const mark = await doc.embedPng(Buffer.from(MARK_PNG_BASE64, "base64"));
  const markH = 48;
  const markW = (mark.width / mark.height) * markH;
  page.drawImage(mark, { x: sx - markW / 2, y: sy - 14, width: markW, height: markH });
  center2(page, "CERTIFIED", sx, sy - 22, sansBold, 7.5, gold, 2.2);
  center2(page, track.title.toUpperCase(), sx, sy - 33, sans, 6, muted, 1.2);

  // Footer: verification
  center("Verify this certificate at", 70, sans, 8.5, muted);
  center(data.verifyUrl, 57, sansBold, 9, purple);
  center(`Certificate ID ${data.id}`, 44, sans, 7.5, muted);

  doc.setTitle(`Massdriver ${track.title} Certification — ${data.name}`);
  doc.setAuthor("Massdriver Certification");
  doc.setSubject(`Certificate ${data.id}`);
  return doc.save();
}

function center2(
  page: import("pdf-lib").PDFPage,
  text: string,
  cx: number,
  y: number,
  font: import("pdf-lib").PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  tracking: number,
) {
  const w = font.widthOfTextAtSize(text, size) + tracking * (text.length - 1);
  let x = cx - w / 2;
  for (const ch of text) {
    page.drawText(ch, { x, y, size, font, color });
    x += font.widthOfTextAtSize(ch, size) + tracking;
  }
}

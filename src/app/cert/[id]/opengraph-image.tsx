import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/brand";
import { formatDate } from "@/lib/certificate";
import { certificateById } from "@/lib/db";
import { TRACKS } from "@/lib/questions";

export const alt = "Massdriver certification";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Satori (the renderer) takes TTF, so these are separate from the woff2 web fonts.
// `new URL(..., import.meta.url)` is the form Next traces into the build output.
// Each call uses a literal path: the bundler only traces static `new URL()` arguments.
async function loadFont(url: URL): Promise<ArrayBuffer> {
  const buf = await readFile(url);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** 1200×630 card for LinkedIn/X/Slack previews of a verification link. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = UUID.test(id) ? await certificateById(id) : null;
  const [bebas, mono, monoMedium] = await Promise.all([
    loadFont(new URL("./og/BebasNeue-Regular.ttf", import.meta.url)),
    loadFont(new URL("./og/JetBrainsMono-Regular.ttf", import.meta.url)),
    loadFont(new URL("./og/JetBrainsMono-Medium.ttf", import.meta.url)),
  ]);
  const fonts = [
    { name: "JetBrains Mono", data: mono, weight: 400 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: monoMedium, weight: 500 as const, style: "normal" as const },
    // Registered at a weight no other font uses: Satori resolves glyphs by
    // weight/style and would otherwise keep using Bebas for later text.
    { name: "Bebas Neue", data: bebas, weight: 700 as const, style: "normal" as const },
  ];

  const name = cert ? (cert.user_name ?? cert.user_email) : "Massdriver Certification";
  const trackTitle = cert ? TRACKS[cert.track].title : "";
  const issued = cert ? formatDate(new Date(cert.issued_at)) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#050506",
          backgroundImage:
            "linear-gradient(#1c1c1f 1px, transparent 1px), linear-gradient(90deg, #1c1c1f 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#fafafa",
          fontFamily: "JetBrains Mono",
          border: "6px solid #2dd4bf",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg viewBox={LOGO_VIEWBOX} width={202} height={56} fill="#fafafa">
            <path fillRule="evenodd" clipRule="evenodd" d={LOGO_PATH} />
          </svg>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, color: "#2dd4bf", textTransform: "uppercase" }}>
            Certificate of Achievement
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {cert ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#c75d3a", textTransform: "uppercase" }}>
                {trackTitle} track
              </div>
              <div style={{ display: "flex", fontFamily: "Bebas Neue", fontWeight: 700, fontSize: 112, lineHeight: 1, marginTop: 8 }}>
                {name}
              </div>
              <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 30, color: "#a1a1aa", marginTop: 18 }}>
                is Massdriver {trackTitle} certified
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontFamily: "Bebas Neue", fontWeight: 700, fontSize: 112, lineHeight: 1 }}>
              Get certified on Massdriver
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#71717a", letterSpacing: 2 }}>
          <div style={{ display: "flex" }}>{cert ? `ISSUED ${issued.toUpperCase()}` : "DEVELOPER · OPS / PLATFORM"}</div>
          <div style={{ display: "flex", color: "#2dd4bf" }}>VERIFIED BY MASSDRIVER CERTIFICATION</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

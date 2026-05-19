import type { CardKind, TemplateSpec } from "./templates";
import { KIND_SIZE_MM, fontStack } from "./templates";

interface CardCanvasProps {
  kind: CardKind;
  template: TemplateSpec;
  data: Record<string, string>;
  photoDataUrl?: string | null;
  /** When set, replaces the template background + decoration with this AI-generated image */
  aiBackgroundDataUrl?: string | null;
  /** rendered width in CSS px (height scales proportionally) */
  width?: number;
  className?: string;
  /** For einladung: which face to render. "cover" = front w/ AI bg, "inside" = inner text+photo. */
  page?: "cover" | "inside";
}

/**
 * SVG renderer for card previews. Mirrors `artifacts/api-server/src/lib/designPdf.ts`
 * so the on-screen preview matches the downloaded PDF as closely as possible.
 */
export function CardCanvas({ kind, template, data, photoDataUrl, aiBackgroundDataUrl, width = 320, className, page = "cover" }: CardCanvasProps) {
  const [wMm, hMm] = KIND_SIZE_MM[kind];
  const scale = width / wMm;
  const h = hMm * scale;
  const vbW = wMm * 10;
  const vbH = hMm * 10;
  const font = fontStack(template);
  const isInside = kind === "einladung" && page === "inside";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={h}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={className}
      role="img"
      aria-label={`Vorschau ${kind} ${template.name} ${page}`}
      style={{ display: "block", boxShadow: "0 6px 20px rgba(0,0,0,0.10)", borderRadius: 8 }}
    >
      {isInside ? (
        <>
          <rect width={vbW} height={vbH} fill={template.background} />
          <EinladungInside template={template} data={data} w={vbW} h={vbH} font={font} photoDataUrl={photoDataUrl} />
        </>
      ) : (
        <>
          {aiBackgroundDataUrl ? (
            <image
              href={aiBackgroundDataUrl}
              x={0}
              y={0}
              width={vbW}
              height={vbH}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              <rect width={vbW} height={vbH} fill={template.background} />
              <Decoration template={template} w={vbW} h={vbH} />
            </>
          )}
          {kind === "einladung" && <Einladung template={template} data={data} w={vbW} h={vbH} font={font} aiBg={!!aiBackgroundDataUrl} />}
          {kind === "tischkarte" && <Tischkarte template={template} data={data} w={vbW} h={vbH} font={font} aiBg={!!aiBackgroundDataUrl} />}
          {kind === "menuekarte" && <Menuekarte template={template} data={data} w={vbW} h={vbH} font={font} aiBg={!!aiBackgroundDataUrl} />}
          {kind === "dankeskarte" && (
            <Dankeskarte template={template} data={data} w={vbW} h={vbH} font={font} photoDataUrl={photoDataUrl} aiBg={!!aiBackgroundDataUrl} />
          )}
        </>
      )}
    </svg>
  );
}

/** Wrap a text string into lines of at most `maxChars` characters. */
function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = (cur ? cur + " " : "") + word;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Inside / detail page of the invitation: photo on top, date + venue + RSVP below. */
function EinladungInside({
  template, data, w, h, font, photoDataUrl,
}: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; photoDataUrl?: string | null }) {
  const datum = data.datum || "Sommer 2026";
  const zeit = data.zeit || "15:00 Uhr";
  const location = data.location || "Eure Hochzeitslocation";
  const ort = data.ort || "";
  const rsvp = data.rsvp || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";
  const gruss = data.gruss ||
    "Wir würden uns von Herzen freuen, diesen besonderen Tag mit euch zu feiern.";

  const margin = 60;
  const photoH = h * 0.42;
  const photoW = w - 2 * margin;
  const hasPhoto = !!photoDataUrl;
  const clipId = "einladung-inside-photo";

  const datumSize = fitSize(datum, photoW * 0.95, 70, CHAR_W.italic);
  const datumTL = Math.min(estimateW(datum, datumSize, CHAR_W.italic), photoW * 0.95);
  const clampLines = (lines: string[], max: number): string[] => {
    if (lines.length <= max) return lines;
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  };
  const grussLines = clampLines(wrapLines(gruss, 36), 3);
  const rsvpLines = clampLines(wrapLines(rsvp, 50), 2);

  const textTop = margin + photoH + 30;

  return (
    <>
      {hasPhoto ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <rect x={margin} y={margin} width={photoW} height={photoH} rx={6} />
            </clipPath>
          </defs>
          <image href={photoDataUrl!} x={margin} y={margin}
            width={photoW} height={photoH}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`} />
          <rect x={margin} y={margin} width={photoW} height={photoH} rx={6}
            fill="none" stroke={template.accent} strokeOpacity={0.35} strokeWidth={1} />
        </>
      ) : (
        <g>
          <rect x={margin} y={margin} width={photoW} height={photoH} rx={6}
            fill="none" stroke={template.accent} strokeOpacity={0.4}
            strokeDasharray="8 6" strokeWidth={1.2} />
          <text x={w / 2} y={margin + photoH / 2 - 14} fontFamily={font} fontSize={22}
            fontStyle="italic" fill={template.accent} textAnchor="middle" dominantBaseline="middle"
            opacity={0.75}>
            Euer Foto
          </text>
          <text x={w / 2} y={margin + photoH / 2 + 14} fontFamily={font} fontSize={14}
            fill={template.accent} textAnchor="middle" dominantBaseline="middle" opacity={0.55}>
            (optional — könnt ihr im nächsten Schritt hochladen)
          </text>
        </g>
      )}

      {/* "Wann & wo" header */}
      <CapsRule text="Wann & wo" cx={w / 2} y={textTop} color={template.accent} font={font}
        size={20} letterSpacing={6} lineLen={w * 0.12} />

      {/* Date — hero */}
      <text x={w / 2} y={textTop + 70} fontFamily={font} fontSize={datumSize}
        fontStyle="italic" fill={template.primary} textAnchor="middle" dominantBaseline="middle"
        textLength={datumTL} lengthAdjust="spacingAndGlyphs">{datum}</text>

      {/* Time · Location */}
      <text x={w / 2} y={textTop + 130} fontFamily={font} fontSize={22}
        fill={template.primary} textAnchor="middle" letterSpacing={2}>
        {zeit.toUpperCase()} · {location}
      </text>
      {ort && (
        <text x={w / 2} y={textTop + 160} fontFamily={font} fontSize={16}
          fontStyle="italic" fill={template.accent} textAnchor="middle" opacity={0.85}>
          {ort}
        </text>
      )}

      {/* Personal greeting */}
      {grussLines.map((ln, i) => (
        <text key={`g${i}`} x={w / 2} y={textTop + 220 + i * 26} fontFamily={font} fontSize={18}
          fontStyle="italic" fill={template.primary} textAnchor="middle">
          {ln}
        </text>
      ))}

      {/* RSVP */}
      {rsvpLines.map((ln, i) => (
        <text key={`r${i}`} x={w / 2} y={h - 90 + i * 22} fontFamily={font} fontSize={14}
          fill={template.accent} textAnchor="middle" opacity={0.8}>
          {ln}
        </text>
      ))}
    </>
  );
}

function Decoration({ template, w, h }: { template: TemplateSpec; w: number; h: number }) {
  switch (template.decoration) {
    case "minimal-line": {
      const cx = w / 2;
      return (
        <g stroke={template.accent} fill="none">
          <line x1={cx - 200} y1={h / 2 - 240} x2={cx - 28} y2={h / 2 - 240} strokeWidth={1.2} />
          <line x1={cx + 28} y1={h / 2 - 240} x2={cx + 200} y2={h / 2 - 240} strokeWidth={1.2} />
          <circle cx={cx} cy={h / 2 - 240} r={5} fill={template.accent} />
          <line x1={cx - 200} y1={h / 2 + 300} x2={cx + 200} y2={h / 2 + 300} strokeWidth={1.2} />
        </g>
      );
    }
    case "frame": {
      const m = 60;
      return (
        <g stroke={template.accent} fill="none">
          <rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} strokeWidth={1.6} />
          <rect x={m + 16} y={m + 16} width={w - 2 * (m + 16)} height={h - 2 * (m + 16)} strokeWidth={0.7} />
          {/* Corner flourishes */}
          {[[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].map(
            ([x, y, sx, sy], i) => (
              <g key={i} transform={`translate(${x},${y}) scale(${sx},${sy})`}>
                <line x1={0} y1={0} x2={26} y2={0} strokeWidth={1.4} />
                <line x1={0} y1={0} x2={0} y2={26} strokeWidth={1.4} />
              </g>
            ),
          )}
        </g>
      );
    }
    case "botanical":
      return (
        <g stroke={template.accent} fill="none" strokeWidth={1.1} strokeLinecap="round">
          <Leaf cx={80} cy={h - 80} flip={false} />
          <Leaf cx={w - 80} cy={80} flip={true} />
          <Leaf cx={w - 80} cy={h - 80} flip={true} />
          <Leaf cx={80} cy={80} flip={false} />
        </g>
      );
    case "monogram": {
      const cx = w / 2;
      const cy = h / 2 - 80;
      const r = Math.min(w, h) * 0.18;
      return (
        <g stroke={template.accent} fill="none">
          <circle cx={cx} cy={cy} r={r} strokeWidth={1.2} />
          <circle cx={cx} cy={cy} r={r * 0.86} strokeWidth={0.6} />
          {/* Slim laurel arms */}
          {[-1, 1].map((s) => (
            <g key={s} stroke={template.accent} strokeWidth={0.7} strokeLinecap="round">
              {[0, 1, 2, 3, 4].map((i) => {
                const t = i / 5;
                const ax = cx + s * (r + 18 + t * 70);
                const ay = cy - 20 + t * 40;
                return <line key={i} x1={ax} y1={ay} x2={ax + s * 14} y2={ay - 10} />;
              })}
            </g>
          ))}
        </g>
      );
    }
    case "editorial":
      return (
        <g>
          <rect x={0} y={0} width={36} height={h} fill={template.accent} />
          <rect x={w - 10} y={0} width={6} height={h} fill={template.accent} opacity={0.5} />
        </g>
      );
    case "wash":
      return (
        <g>
          {Array.from({ length: 18 }).map((_, i) => (
            <rect key={i} x={0} y={(h * i) / 18} width={w} height={h / 18} fill={template.accent} opacity={0.04} />
          ))}
        </g>
      );
    case "art-deco": {
      const FanCorner = ({ x, y, sx, sy }: { x: number; y: number; sx: 1 | -1; sy: 1 | -1 }) => (
        <g transform={`translate(${x},${y}) scale(${sx},${sy})`} stroke={template.accent} strokeWidth={1.2} fill="none" strokeLinecap="round">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 5) * (Math.PI / 2);
            const len = 110 - i * 6;
            return <line key={i} x1={0} y1={0} x2={Math.cos(a) * len} y2={Math.sin(a) * len} />;
          })}
          {/* Quarter-arc */}
          <path d={`M ${120} 0 A 120 120 0 0 1 0 120`} strokeWidth={0.8} />
        </g>
      );
      return (
        <g>
          <FanCorner x={50} y={50} sx={1} sy={1} />
          <FanCorner x={w - 50} y={50} sx={-1} sy={1} />
          <FanCorner x={50} y={h - 50} sx={1} sy={-1} />
          <FanCorner x={w - 50} y={h - 50} sx={-1} sy={-1} />
          {/* Center diamond divider — clamp inside the card */}
          {(() => {
            const desiredY = h / 2 + 280;
            const maxY = h - 90;
            const dy = Math.min(desiredY, maxY);
            return (
              <g stroke={template.accent} strokeWidth={1} fill="none">
                <line x1={w / 2 - 140} y1={dy} x2={w / 2 - 18} y2={dy} />
                <line x1={w / 2 + 18} y1={dy} x2={w / 2 + 140} y2={dy} />
                <g transform={`translate(${w / 2},${dy}) rotate(45)`}>
                  <rect x={-9} y={-9} width={18} height={18} fill="none" />
                  <rect x={-4} y={-4} width={8} height={8} fill={template.accent} />
                </g>
              </g>
            );
          })()}
        </g>
      );
    }
    case "arch": {
      const m = 70;
      const archX = m;
      const archY = m;
      const archW = w - 2 * m;
      const maxArchH = h - 2 * m;
      const r = Math.min(archW / 2, maxArchH * 0.55);
      const innerH = Math.max(maxArchH, r);
      const d = `M ${archX} ${archY + innerH} L ${archX} ${archY + r} A ${r} ${r} 0 0 1 ${archX + archW} ${archY + r} L ${archX + archW} ${archY + innerH}`;
      return (
        <g stroke={template.accent} fill="none">
          <path d={d} strokeWidth={1.4} />
          <path
            d={`M ${archX + 14} ${archY + innerH} L ${archX + 14} ${archY + r + 4} A ${r - 14} ${r - 14} 0 0 1 ${archX + archW - 14} ${archY + r + 4} L ${archX + archW - 14} ${archY + innerH}`}
            strokeWidth={0.6}
            opacity={0.7}
          />
        </g>
      );
    }
    case "wreath": {
      const cx = w / 2;
      const cy = h * 0.16;
      const r = Math.min(w * 0.18, h * 0.1);
      const n = 16;
      return (
        <g stroke={template.accent} fill="none" strokeWidth={1} strokeLinecap="round">
          {Array.from({ length: n }).map((_, i) => {
            const a = Math.PI + (i / (n - 1)) * Math.PI;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            const tx = Math.cos(a + Math.PI / 2);
            const ty = Math.sin(a + Math.PI / 2);
            const len = 18;
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x + tx * len} y2={y + ty * len} />
                <line x1={x + tx * 4} y1={y + ty * 4} x2={x + tx * 4 + tx * 8 + ty * 6} y2={y + ty * 4 + ty * 8 - tx * 6} strokeWidth={0.7} />
              </g>
            );
          })}
          {/* tiny bottom bow tie */}
          <circle cx={cx} cy={cy + r + 6} r={3} fill={template.accent} stroke="none" />
        </g>
      );
    }
    case "terrazzo": {
      const dots: Array<[number, number, number, number]> = [
        [60, 90, 6, 0.6], [140, 200, 4, 0.45], [w - 80, 130, 5, 0.55], [w - 140, 320, 3, 0.4],
        [80, h - 130, 7, 0.55], [w - 100, h - 80, 5, 0.6], [w / 2 - 120, h - 200, 4, 0.5],
        [w / 2 + 90, 70, 3, 0.4], [220, h - 320, 4, 0.5], [w - 220, h / 2, 5, 0.45],
        [40, h / 2 + 80, 3, 0.4], [w / 2 + 200, h - 90, 4, 0.55], [w / 2 - 220, h / 3, 3, 0.4],
      ];
      return (
        <g fill={template.accent}>
          {dots.map(([x, y, r, op], i) => (
            <circle key={i} cx={x} cy={y} r={r} opacity={op} />
          ))}
        </g>
      );
    }
  }
}

function Leaf({ cx, cy, flip }: { cx: number; cy: number; flip: boolean }) {
  return (
    <g transform={`translate(${cx},${cy}) ${flip ? "scale(-1,1)" : ""}`}>
      <line x1={0} y1={0} x2={180} y2={-180} />
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (i + 1) / 6;
        const x = 180 * t;
        const y = -180 * t;
        const lx = 40 * (i % 2 === 0 ? 1 : -1);
        const ly = -40 * (i % 2 === 0 ? -1 : 1);
        return <line key={i} x1={x} y1={y} x2={x + lx} y2={y + ly} />;
      })}
    </g>
  );
}

// ─── Typography helpers ──────────────────────────────────────────────────────

// Approximate character widths (relative to fontSize) for typical fonts.
// Used purely for auto-fit shrinking — exact width is never required.
const CHAR_W = { bold: 0.62, italic: 0.58, regular: 0.55, caps: 0.7 };

function fitSize(
  text: string,
  maxW: number,
  base: number,
  cw: number = CHAR_W.bold,
  letterSpacing = 0,
  minScale = 0.45,
): number {
  if (!text) return base;
  const len = text.length;
  const natural = len * base * cw + Math.max(0, len - 1) * letterSpacing;
  if (natural <= maxW) return base;
  const denom = len * cw;
  if (denom <= 0) return base;
  const fitted = (maxW - Math.max(0, len - 1) * letterSpacing) / denom;
  return Math.max(base * minScale, fitted);
}

/** Estimated rendered width of a text run in SVG units. Used to drive a
 *  conservative `textLength` so glyphs are squeezed (not overflowed) if the
 *  font ends up wider than the estimate. */
function estimateW(text: string, size: number, cw: number, letterSpacing = 0): number {
  return text.length * size * cw + Math.max(0, text.length - 1) * letterSpacing;
}

interface Block {
  text: string;
  size: number;             // base font size (in SVG units; viewBox = mm * 10)
  weight?: number;
  italic?: boolean;
  color?: string;
  upper?: boolean;
  letterSpacing?: number;
  marginTop?: number;       // mm
  maxWidthPct?: number;     // 0..1 — fraction of card width text may occupy
  charKind?: keyof typeof CHAR_W; // for auto-fit estimate
}

function CenteredStack({
  blocks, w, startY, template, font,
}: { blocks: Block[]; w: number; startY: number; template: TemplateSpec; font: string }) {
  let y = startY;
  return (
    <g>
      {blocks.filter((b) => b.text).map((b, i) => {
        y += (b.marginTop ?? 0) * 10;
        const maxW = w * (b.maxWidthPct ?? 0.82);
        const cw = CHAR_W[b.charKind ?? (b.weight && b.weight >= 600 ? "bold" : b.italic ? "italic" : b.upper ? "caps" : "regular")];
        const renderText = b.upper ? b.text.toUpperCase() : b.text;
        const size = fitSize(renderText, maxW, b.size, cw, b.letterSpacing ?? 0);
        const el = (
          <text
            key={i}
            x={w / 2}
            y={y}
            fontFamily={font}
            fontSize={size}
            fontWeight={b.weight ?? 400}
            fontStyle={b.italic ? "italic" : "normal"}
            fill={b.color ?? template.primary}
            textAnchor="middle"
            letterSpacing={b.letterSpacing ?? 0}
            dominantBaseline="hanging"
          >
            {renderText}
          </text>
        );
        y += size * 1.18;
        return el;
      })}
    </g>
  );
}

/** Soft cream "glass" panel + thin border, drawn on top of the AI background
 *  so the typography stays sharp and readable regardless of the artwork. */
function GlassPanel({
  x, y, w, h, accent,
}: { x: number; y: number; w: number; h: number; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#fffdf7" opacity={0.9} rx={4} />
      <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24}
        fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={1.4} />
      <rect x={x + 20} y={y + 20} width={w - 40} height={h - 40}
        fill="none" stroke={accent} strokeOpacity={0.25} strokeWidth={0.7} />
    </g>
  );
}

/** Small spaced-caps header with hairlines on either side and a centred dot.
 *  Renders inline at the supplied y coordinate (SVG units). */
function CapsRule({
  text, cx, y, color, font, size = 28, letterSpacing = 8, lineLen = 90,
}: { text: string; cx: number; y: number; color: string; font: string; size?: number; letterSpacing?: number; lineLen?: number }) {
  const approxTextW = text.length * size * CHAR_W.caps + Math.max(0, text.length - 1) * letterSpacing;
  const gap = approxTextW / 2 + 24;
  return (
    <g stroke={color} fill={color}>
      <line x1={cx - gap - lineLen} y1={y} x2={cx - gap} y2={y} strokeWidth={0.9} />
      <line x1={cx + gap} y1={y} x2={cx + gap + lineLen} y2={y} strokeWidth={0.9} />
      <circle cx={cx - gap - lineLen - 6} cy={y} r={2.2} stroke="none" />
      <circle cx={cx + gap + lineLen + 6} cy={y} r={2.2} stroke="none" />
      <text x={cx} y={y + 3} fontFamily={font} fontSize={size}
        textAnchor="middle" dominantBaseline="middle"
        letterSpacing={letterSpacing} fill={color}>
        {text.toUpperCase()}
      </text>
    </g>
  );
}

function Einladung({ template, data, w, h, font, aiBg }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; aiBg: boolean }) {
  const partner1 = data.partner1 || "Anna";
  const partner2 = data.partner2 || "Markus";
  const datum = data.datum || "Sommer 2026";
  const location = data.location || "Eure Hochzeitslocation";
  const ort = data.ort || "";
  const zeit = data.zeit || "15:00 Uhr";
  const rsvp = data.rsvp || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";

  const panelX = w * 0.12;
  const panelY = h * 0.1;
  const panelW = w - 2 * panelX;
  const panelH = h - 2 * panelY;
  const innerW = panelW - 80;

  // Names: dramatically smaller base so they read like real wedding stationery.
  // textLength below provides a hard cap that smoothly compresses if the
  // actual rendered glyphs are wider than our estimate.
  const nameMax = innerW * 0.85;
  const nameBase = 120; // ~12mm
  const sz1 = fitSize(partner1, nameMax, nameBase, CHAR_W.italic);
  const sz2 = fitSize(partner2, nameMax, nameBase, CHAR_W.italic);
  const nameSize = Math.min(sz1, sz2);
  const w1 = estimateW(partner1, nameSize, CHAR_W.italic);
  const w2 = estimateW(partner2, nameSize, CHAR_W.italic);
  const tl1 = Math.min(w1, nameMax);
  const tl2 = Math.min(w2, nameMax);
  const cy = panelY + panelH * 0.42;

  return (
    <>
      {aiBg && <GlassPanel x={panelX} y={panelY} w={panelW} h={panelH} accent={template.accent} />}

      <CapsRule text="Wir heiraten" cx={w / 2} y={panelY + 70} color={template.accent} font={font}
        size={22} letterSpacing={6} lineLen={panelW * 0.15} />

      {/* Names block — vertically centred inside the panel */}
      <g>
        <text x={w / 2} y={cy - nameSize * 0.85} fontFamily={font} fontSize={nameSize}
          fontWeight={400} fontStyle="italic" fill={template.primary}
          textAnchor="middle" dominantBaseline="middle"
          textLength={tl1} lengthAdjust="spacingAndGlyphs">{partner1}</text>
        <text x={w / 2} y={cy} fontFamily={font}
          fontSize={nameSize * 0.62} fontStyle="italic" fill={template.accent}
          textAnchor="middle" dominantBaseline="middle">&amp;</text>
        <text x={w / 2} y={cy + nameSize * 0.85} fontFamily={font} fontSize={nameSize}
          fontWeight={400} fontStyle="italic" fill={template.primary}
          textAnchor="middle" dominantBaseline="middle"
          textLength={tl2} lengthAdjust="spacingAndGlyphs">{partner2}</text>
      </g>

      {/* Date + venue block, lower third */}
      <CapsRule text={datum} cx={w / 2} y={panelY + panelH * 0.78} color={template.primary} font={font}
        size={22} letterSpacing={5} lineLen={panelW * 0.12} />

      <CenteredStack
        template={template}
        font={font}
        w={w}
        startY={panelY + panelH * 0.78 + 28}
        blocks={[
          { text: `${zeit} · ${location}`, size: 22, marginTop: 4, maxWidthPct: 0.68 },
          { text: ort, size: 20, color: template.accent, italic: true, marginTop: 1, maxWidthPct: 0.68 },
          { text: rsvp, size: 16, italic: true, marginTop: 8, maxWidthPct: 0.62, color: template.primary },
        ]}
      />
    </>
  );
}

function Tischkarte({ template, data, w, h, font, aiBg }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; aiBg: boolean }) {
  const guest = data.gastname || "Gast Name";
  const tisch = data.tisch || "";
  const partner1 = data.partner1 || "";
  const partner2 = data.partner2 || "";
  const couple = partner1 && partner2 ? `${partner1} & ${partner2}` : "";

  const panelX = 50, panelY = 50;
  const panelW = w - 100, panelH = h - 100;
  const innerW = panelW - 50;

  const guestSize = fitSize(guest, innerW * 0.9, 110, CHAR_W.italic);
  const guestW = Math.min(estimateW(guest, guestSize, CHAR_W.italic), innerW * 0.9);

  return (
    <>
      {aiBg && <GlassPanel x={panelX} y={panelY} w={panelW} h={panelH} accent={template.accent} />}
      {!aiBg && (
        <rect x={30} y={30} width={w - 60} height={h - 60} stroke={template.accent} strokeWidth={0.8} fill="none" />
      )}
      {couple && (
        <text x={w / 2} y={h / 2 - guestSize * 0.85} fontFamily={font} fontSize={14}
          letterSpacing={3} fill={template.accent} textAnchor="middle" dominantBaseline="middle">
          {couple.toUpperCase()}
        </text>
      )}
      <text x={w / 2} y={h / 2} fontFamily={font} fontSize={guestSize}
        fontStyle="italic" fill={template.primary} textAnchor="middle" dominantBaseline="middle"
        textLength={guestW} lengthAdjust="spacingAndGlyphs">
        {guest}
      </text>
      {tisch && (
        <text x={w / 2} y={h / 2 + guestSize * 0.75} fontFamily={font} fontSize={16}
          letterSpacing={2} fill={template.accent} textAnchor="middle" dominantBaseline="middle">
          {tisch.toUpperCase()}
        </text>
      )}
    </>
  );
}

function Menuekarte({ template, data, w, h, font, aiBg }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; aiBg: boolean }) {
  const partner1 = data.partner1 || "Anna";
  const partner2 = data.partner2 || "Markus";
  const datum = data.datum || "";
  const courses = [
    { l: "Vorspeise", v: data.vorspeise || "" },
    { l: "Suppe", v: data.suppe || "" },
    { l: "Hauptgang", v: data.hauptgang || "" },
    { l: "Dessert", v: data.dessert || "" },
    { l: "Getränke", v: data.getraenke || "" },
  ].filter((c) => c.v);

  const panelX = w * 0.1, panelY = h * 0.07;
  const panelW = w - 2 * panelX, panelH = h - 2 * panelY;
  const innerW = panelW - 80;

  const couple = `${partner1} & ${partner2}`;
  const coupleSize = fitSize(couple, innerW * 0.85, 90, CHAR_W.italic);
  const coupleW = Math.min(estimateW(couple, coupleSize, CHAR_W.italic), innerW * 0.85);

  let y = panelY + 360;
  return (
    <>
      {aiBg && <GlassPanel x={panelX} y={panelY} w={panelW} h={panelH} accent={template.accent} />}

      <CapsRule text="Menü" cx={w / 2} y={panelY + 70} color={template.accent} font={font}
        size={22} letterSpacing={8} lineLen={panelW * 0.18} />

      <text x={w / 2} y={panelY + 180} fontFamily={font} fontSize={coupleSize}
        fontStyle="italic" fill={template.primary}
        textAnchor="middle" dominantBaseline="middle"
        textLength={coupleW} lengthAdjust="spacingAndGlyphs">{couple}</text>

      {datum && (
        <text x={w / 2} y={panelY + 260} fontFamily={font} fontSize={16}
          letterSpacing={4} fill={template.accent} textAnchor="middle">{datum.toUpperCase()}</text>
      )}

      {courses.length === 0 && (
        <text x={w / 2} y={y + 40} fontFamily={font} fontSize={26}
          fontStyle="italic" fill={template.accent} textAnchor="middle">
          Trage euer Menü ein …
        </text>
      )}
      {courses.map((c, i) => {
        const start = y;
        y += 140;
        const vSize = fitSize(c.v, innerW * 0.88, 30, CHAR_W.italic);
        const vW = Math.min(estimateW(c.v, vSize, CHAR_W.italic), innerW * 0.88);
        return (
          <g key={i}>
            <text x={w / 2} y={start} fontFamily={font} fontSize={14} fill={template.accent}
              textAnchor="middle" letterSpacing={4}>
              {c.l.toUpperCase()}
            </text>
            <text x={w / 2} y={start + 48} fontFamily={font} fontSize={vSize} fontStyle="italic" fill={template.primary}
              textAnchor="middle" textLength={vW} lengthAdjust="spacingAndGlyphs">
              {c.v}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Dankeskarte({
  template, data, w, h, font, photoDataUrl, aiBg,
}: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; photoDataUrl?: string | null; aiBg: boolean }) {
  const partner1 = data.partner1 || "Anna";
  const partner2 = data.partner2 || "Markus";
  const datum = data.datum || "";
  const text = data.dankestext ||
    "Von Herzen Danke für eure Glückwünsche, eure Geschenke und für die wunderschöne Zeit, die wir mit euch teilen durften.";

  const photoX = 60;
  const photoY = 60;
  const photoW = w * 0.42;
  const photoH = h - 120;
  const tx = photoX + photoW + 50;
  const tw = w - tx - 60;
  const clipId = "danke-clip";

  // Wrap dankes text into lines for SVG (~30 chars per line)
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if ((cur + " " + word).trim().length > 30) {
      if (cur) lines.push(cur);
      cur = word;
    } else cur = (cur ? cur + " " : "") + word;
  }
  if (cur) lines.push(cur);

  const couple = `${partner1} & ${partner2}`;
  const coupleSize = fitSize(couple, tw * 0.95, 52, CHAR_W.italic);
  const coupleW = Math.min(estimateW(couple, coupleSize, CHAR_W.italic), tw * 0.95);

  return (
    <>
      {aiBg && (
        <GlassPanel x={tx - 30} y={50} w={tw + 60} h={h - 100} accent={template.accent} />
      )}
      <defs>
        <clipPath id={clipId}>
          <rect x={photoX} y={photoY} width={photoW} height={photoH} />
        </clipPath>
      </defs>
      {photoDataUrl ? (
        <image
          href={photoDataUrl}
          x={photoX}
          y={photoY}
          width={photoW}
          height={photoH}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <g>
          <rect x={photoX} y={photoY} width={photoW} height={photoH} fill={aiBg ? "rgba(255,253,247,0.92)" : "none"}
            stroke={template.accent} strokeWidth={0.8} strokeDasharray="6 4" />
          <text x={photoX + photoW / 2} y={photoY + photoH / 2} fontFamily={font} fontSize={24}
            fontStyle="italic" fill={template.accent} textAnchor="middle" dominantBaseline="middle">
            Foto später ergänzen
          </text>
        </g>
      )}
      <text x={tx} y={110} fontFamily={font} fontSize={16} fill={template.accent} letterSpacing={6}>
        DANKE
      </text>
      <text x={tx} y={110 + coupleSize * 0.95} fontFamily={font} fontSize={coupleSize}
        fontStyle="italic" fill={template.primary}
        textLength={coupleW} lengthAdjust="spacingAndGlyphs">
        {couple}
      </text>
      {datum && (
        <text x={tx} y={110 + coupleSize * 1.8} fontFamily={font} fontSize={14}
          letterSpacing={3} fill={template.accent}>
          {datum.toUpperCase()}
        </text>
      )}
      {lines.map((ln, i) => (
        <text key={i} x={tx} y={110 + coupleSize * 2.6 + i * 30} fontFamily={font} fontSize={20} fill={template.primary}>
          {ln}
        </text>
      ))}
    </>
  );
}

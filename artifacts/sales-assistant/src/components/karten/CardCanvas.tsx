import type { CardKind, TemplateSpec } from "./templates";
import { KIND_SIZE_MM, fontStack } from "./templates";

interface CardCanvasProps {
  kind: CardKind;
  template: TemplateSpec;
  data: Record<string, string>;
  photoDataUrl?: string | null;
  /** rendered width in CSS px (height scales proportionally) */
  width?: number;
  className?: string;
}

/**
 * SVG renderer for card previews. Mirrors `artifacts/api-server/src/lib/designPdf.ts`
 * so the on-screen preview matches the downloaded PDF as closely as possible.
 */
export function CardCanvas({ kind, template, data, photoDataUrl, width = 320, className }: CardCanvasProps) {
  const [wMm, hMm] = KIND_SIZE_MM[kind];
  const scale = width / wMm;
  const h = hMm * scale;
  const vbW = wMm * 10;
  const vbH = hMm * 10;
  const font = fontStack(template);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={h}
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={className}
      role="img"
      aria-label={`Vorschau ${kind} ${template.name}`}
      style={{ display: "block", boxShadow: "0 6px 20px rgba(0,0,0,0.10)", borderRadius: 8 }}
    >
      <rect width={vbW} height={vbH} fill={template.background} />
      <Decoration template={template} w={vbW} h={vbH} />
      {kind === "einladung" && <Einladung template={template} data={data} w={vbW} h={vbH} font={font} />}
      {kind === "tischkarte" && <Tischkarte template={template} data={data} w={vbW} h={vbH} font={font} />}
      {kind === "menuekarte" && <Menuekarte template={template} data={data} w={vbW} h={vbH} font={font} />}
      {kind === "dankeskarte" && (
        <Dankeskarte template={template} data={data} w={vbW} h={vbH} font={font} photoDataUrl={photoDataUrl} />
      )}
    </svg>
  );
}

function Decoration({ template, w, h }: { template: TemplateSpec; w: number; h: number }) {
  switch (template.decoration) {
    case "minimal-line": {
      const cx = w / 2;
      return (
        <g stroke={template.accent} strokeWidth={1.4} fill="none">
          <line x1={cx - 180} y1={h / 2 - 240} x2={cx + 180} y2={h / 2 - 240} />
          <line x1={cx - 180} y1={h / 2 + 300} x2={cx + 180} y2={h / 2 + 300} />
        </g>
      );
    }
    case "frame": {
      const m = 60;
      return (
        <g stroke={template.accent} fill="none">
          <rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} strokeWidth={1.6} />
          <rect x={m + 16} y={m + 16} width={w - 2 * (m + 16)} height={h - 2 * (m + 16)} strokeWidth={0.8} />
        </g>
      );
    }
    case "botanical":
      return (
        <g stroke={template.accent} fill="none" strokeWidth={1.2} strokeLinecap="round">
          <Leaf cx={80} cy={h - 80} flip={false} />
          <Leaf cx={w - 80} cy={80} flip={true} />
        </g>
      );
    case "monogram": {
      const cx = w / 2;
      const cy = h / 2 - 80;
      const r = Math.min(w, h) * 0.18;
      return (
        <g stroke={template.accent} fill="none">
          <circle cx={cx} cy={cy} r={r} strokeWidth={1.2} />
          <circle cx={cx} cy={cy} r={r * 0.85} strokeWidth={0.7} />
        </g>
      );
    }
    case "editorial":
      return <rect x={0} y={0} width={30} height={h} fill={template.accent} />;
    case "wash":
      return (
        <g>
          {Array.from({ length: 18 }).map((_, i) => (
            <rect key={i} x={0} y={(h * i) / 18} width={w} height={h / 18} fill={template.accent} opacity={0.04} />
          ))}
        </g>
      );
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

interface Block {
  text: string;
  size: number;
  weight?: number;
  italic?: boolean;
  color?: string;
  upper?: boolean;
  letterSpacing?: number;
  marginTop?: number;
}

function CenteredStack({
  blocks, w, startY, template, font,
}: { blocks: Block[]; w: number; startY: number; template: TemplateSpec; font: string }) {
  let y = startY;
  return (
    <g>
      {blocks.filter((b) => b.text).map((b, i) => {
        y += (b.marginTop ?? 0) * 10;
        const el = (
          <text
            key={i}
            x={w / 2}
            y={y}
            fontFamily={font}
            fontSize={b.size * 10}
            fontWeight={b.weight ?? 400}
            fontStyle={b.italic ? "italic" : "normal"}
            fill={b.color ?? template.primary}
            textAnchor="middle"
            letterSpacing={b.letterSpacing ?? 0}
            dominantBaseline="hanging"
          >
            {b.upper ? b.text.toUpperCase() : b.text}
          </text>
        );
        y += b.size * 10 * 1.15;
        return el;
      })}
    </g>
  );
}

function Einladung({ template, data, w, h, font }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string }) {
  const partner1 = data.partner1 || "Anna";
  const partner2 = data.partner2 || "Markus";
  const datum = data.datum || "Sommer 2026";
  const location = data.location || "Eure Hochzeitslocation";
  const ort = data.ort || "";
  const zeit = data.zeit || "15:00 Uhr";
  const rsvp = data.rsvp || "Bitte um Rückmeldung bis vier Wochen vor dem Fest.";

  return (
    <CenteredStack
      template={template}
      font={font}
      w={w}
      startY={180}
      blocks={[
        { text: "Wir heiraten", size: 9, upper: true, letterSpacing: 4, color: template.accent },
        { text: partner1, size: 30, weight: 700, marginTop: 12 },
        { text: "&", size: 20, italic: true, color: template.accent, marginTop: 2 },
        { text: partner2, size: 30, weight: 700, marginTop: 2 },
        { text: datum, size: 11, upper: true, letterSpacing: 3, marginTop: 16 },
        { text: `${zeit} · ${location}`, size: 9, marginTop: 5 },
        { text: ort, size: 8, color: template.accent, marginTop: 1 },
        { text: rsvp, size: 7, italic: true, marginTop: 18 },
      ]}
    />
  );
}

function Tischkarte({ template, data, w, h, font }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string }) {
  const guest = data.gastname || "Gast Name";
  const tisch = data.tisch || "";
  const partner1 = data.partner1 || "";
  const partner2 = data.partner2 || "";
  const couple = partner1 && partner2 ? `${partner1} & ${partner2}` : "";

  return (
    <>
      <rect x={30} y={30} width={w - 60} height={h - 60} stroke={template.accent} strokeWidth={0.8} fill="none" />
      <CenteredStack
        template={template}
        font={font}
        w={w}
        startY={h / 2 - 100}
        blocks={[
          { text: couple, size: 7, upper: true, letterSpacing: 2, color: template.accent },
          { text: guest, size: 22, weight: 700, marginTop: 5 },
          { text: tisch, size: 9, marginTop: 5, color: template.accent, letterSpacing: 1 },
        ]}
      />
    </>
  );
}

function Menuekarte({ template, data, w, h, font }: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string }) {
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

  let y = h * 0.36;
  return (
    <>
      <CenteredStack
        template={template}
        font={font}
        w={w}
        startY={160}
        blocks={[
          { text: "Menü", size: 9, upper: true, letterSpacing: 5, color: template.accent },
          { text: `${partner1} & ${partner2}`, size: 22, weight: 700, marginTop: 10 },
          { text: datum, size: 8, upper: true, letterSpacing: 3, color: template.accent, marginTop: 4 },
        ]}
      />
      {courses.length === 0 && (
        <text x={w / 2} y={y + 40} fontFamily={font} fontSize={90} fontStyle="italic" fill={template.accent} textAnchor="middle">
          Trage euer Menü ein …
        </text>
      )}
      {courses.map((c, i) => {
        const start = y;
        y += 200;
        return (
          <g key={i}>
            <text x={w / 2} y={start} fontFamily={font} fontSize={75} fontWeight={700} fill={template.accent}
              textAnchor="middle" letterSpacing={3}>
              {c.l.toUpperCase()}
            </text>
            <text x={w / 2} y={start + 90} fontFamily={font} fontSize={95} fontStyle="italic" fill={template.primary}
              textAnchor="middle">
              {c.v}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Dankeskarte({
  template, data, w, h, font, photoDataUrl,
}: { template: TemplateSpec; data: Record<string, string>; w: number; h: number; font: string; photoDataUrl?: string | null }) {
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

  // Wrap dankes text into lines for SVG (~28 chars per line)
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 28) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur ? cur + " " : "") + w;
  }
  if (cur) lines.push(cur);

  return (
    <>
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
          <rect x={photoX} y={photoY} width={photoW} height={photoH} fill="none"
            stroke={template.accent} strokeWidth={0.8} strokeDasharray="6 4" />
          <text x={photoX + photoW / 2} y={photoY + photoH / 2} fontFamily={font} fontSize={80}
            fontStyle="italic" fill={template.accent} textAnchor="middle" dominantBaseline="middle">
            Foto später ergänzen
          </text>
        </g>
      )}
      <text x={tx} y={130} fontFamily={font} fontSize={75} fontWeight={700} fill={template.accent} letterSpacing={5}>
        DANKE
      </text>
      <text x={tx} y={230} fontFamily={font} fontSize={155} fontWeight={700} fill={template.primary}>
        {`${partner1} & ${partner2}`}
      </text>
      {datum && (
        <text x={tx} y={290} fontFamily={font} fontSize={75} fontStyle="italic" fill={template.accent}>
          {datum}
        </text>
      )}
      {lines.map((ln, i) => (
        <text key={i} x={tx} y={360 + i * 100} fontFamily={font} fontSize={80} fill={template.primary}>
          {ln}
        </text>
      ))}
    </>
  );
}

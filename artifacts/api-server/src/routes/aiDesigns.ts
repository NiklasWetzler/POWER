import { Router, type IRouter } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const router: IRouter = Router();

// Hard cap: max 12 requests/hour per customer (if logged in) or per IP (anon).
// ×3 images = ≤36 images/hour per identity. Public access; no login required.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const cid = req.session?.customerId;
    if (cid) return `c${cid}`;
    return `ip${ipKeyGenerator(req.ip ?? "")}`;
  },
  message: { error: "Zu viele KI-Anfragen. Bitte in einer Stunde erneut versuchen." },
});

interface AiBgBody {
  style?: string;
  prompt?: string;
  count?: number;
}

/** Style presets — each one is a hand-tuned Flux prompt that yields high-end
 *  wedding-stationery cover art with the centre kept clear for typography. */
const STYLE_PROMPTS: Record<string, string> = {
  "watercolor-floral":
    "loose hand-painted watercolour wedding invitation artwork, blush peonies, eucalyptus and wildflowers wrapping the top and bottom of the card, soft bleed edges, pale cream paper background, romantic and airy, professional bridal stationery, no text",
  "gold-art-deco":
    "luxury art-deco wedding invitation, deep navy background with intricate gold-foil geometric border, sunburst fans and mirrored linework, 1920s Gatsby refinement, Vogue stationery, no text",
  "minimal-modern":
    "ultra-minimalist editorial wedding card, warm off-white paper, a single delicate hairline frame, one small abstract botanical ink mark, vast negative space, Kinfolk magazine aesthetic, no text",
  "boho-pampas":
    "boho wedding invitation, dried pampas grass, palm fronds and dried wildflowers, terracotta and warm cream palette, hand-drawn texture, organic earthy mood, Pinterest wedding inspiration, no text",
  "vintage-ivory":
    "vintage parchment wedding card, aged ivory paper with subtle deckle edges, sepia botanical etching in the corners, classical engraving style, fine intaglio detail, no text",
  "wildflower-meadow":
    "loose wildflower meadow watercolour wedding stationery, scattered daisies, lavender, baby's breath, pastel palette, joyful and illustrative, no text",
  "gold-monogram":
    "luxurious cream wedding card with delicate gold-foil laurel wreath at the top and a thin metallic line frame, refined classical sophistication, magazine-quality stationery, no text",
  "moody-floral":
    "moody dark-romance wedding invitation, deep burgundy and forest green florals on charcoal background, oil-painting style, dramatic and intimate, dark academia, no text",
  "blue-china":
    "delft-blue wedding invitation, hand-painted indigo botanicals and chinoiserie florals on ivory, fine porcelain elegance, symmetrical wrap-around floral border, top and bottom heavy, centre empty, no text",
  "soft-greenery":
    "soft sage and ivory wedding invitation, watercolour eucalyptus and olive branches framing the card, gentle pastel greens, modern romantic, no text",
};

/** Build a Pollinations / Flux prompt for an A6-ish portrait wedding card cover. */
function buildPrompt(styleKey: string | undefined, custom: string | undefined): string {
  const styleDirective =
    (styleKey && STYLE_PROMPTS[styleKey]) ||
    custom?.slice(0, 400) ||
    STYLE_PROMPTS["watercolor-floral"];

  return [
    "Single elegant wedding INVITATION cover artwork, portrait A6 proportions, edge-to-edge print-ready design.",
    `Style: ${styleDirective}.`,
    "Composition: decorative motifs wrap the top and bottom borders of the card while leaving the entire central vertical band intentionally EMPTY and clean for typography to be laid on top later.",
    "ABSOLUTELY NO letters, words, names, dates, numbers, monograms, signatures, alphabets, calligraphy, lorem ipsum or any typographic characters of any kind anywhere in the image.",
    "No mockups, no card-on-table photos, no shadows of a card. Just the flat printable artwork itself.",
    "High-end professional graphic-designer quality, suitable for a luxury bridal magazine, sharp, clean, beautiful colour balance.",
  ].join(" ");
}

/** Call Pollinations.ai (free, no API key, Flux model) and return the image
 *  as a data: URL we can pass directly to <img>/PDF. */
async function pollinationsImage(prompt: string, seed: number): Promise<string> {
  // Portrait A6-ish (105×148mm at ~6.5 px/mm ≈ 683×963). Round up a bit for
  // crisp print previews; Flux handles 768×1152 well.
  const width = 768;
  const height = 1152;
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}` +
    `&model=flux&nologo=true&enhance=true&private=true&seed=${seed}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  let resp: Response;
  try {
    resp = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    throw new Error(`pollinations responded ${resp.status}`);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length === 0) throw new Error("pollinations returned empty body");
  // Pollinations serves JPEG by default; honour the actual content-type header.
  const ct = resp.headers.get("content-type") || "image/jpeg";
  const safeCt = /^image\/(png|jpeg|jpg|webp)$/.test(ct) ? ct.replace("/jpg", "/jpeg") : "image/jpeg";
  return `data:${safeCt};base64,${buf.toString("base64")}`;
}

router.post("/ai/card-background", aiLimiter, async (req, res): Promise<void> => {
  const body = req.body as AiBgBody;
  const styleKey = typeof body.style === "string" ? body.style : undefined;
  const customPrompt = typeof body.prompt === "string" ? body.prompt : undefined;
  if (styleKey && !STYLE_PROMPTS[styleKey] && !customPrompt) {
    res.status(400).json({ error: "Ungültiger Stil." });
    return;
  }
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 3);
  const prompt = buildPrompt(styleKey, customPrompt);

  req.log.info({ styleKey, count }, "Generating AI invitation backgrounds via Pollinations");

  // Use independent seeds so variants are visually distinct.
  const seeds = Array.from({ length: count }, () => Math.floor(Math.random() * 1_000_000_000));
  const settled = await Promise.allSettled(seeds.map((seed) => pollinationsImage(prompt, seed)));
  const images: string[] = [];
  const failures: unknown[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") images.push(r.value);
    else failures.push(r.reason);
  }
  if (images.length === 0) {
    req.log.error({ failures }, "Pollinations image generation failed for all seeds");
    res.status(502).json({ error: "KI-Bildgenerierung gerade nicht verfügbar. Bitte in 1–2 Minuten nochmal versuchen." });
    return;
  }
  if (failures.length > 0) {
    req.log.warn({ failures: failures.length, ok: images.length }, "Partial Pollinations success");
  }
  res.json({ images });
});

export default router;

import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { generateImage, isGeminiConfigured } from "@workspace/integrations-gemini-ai/image";
import { requireCustomer } from "../lib/authMiddleware";
import { KIND_SIZE_MM, type CardKind } from "../lib/designTemplates";

const router: IRouter = Router();

const KIND_VALUES = new Set<CardKind>([
  "einladung",
  "tischkarte",
  "menuekarte",
  "dankeskarte",
]);

// Hard cap per customer: max 10 requests/hour (×3 images = ≤30 images/hour)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `c${req.session?.customerId ?? "anon"}`,
  message: { error: "Zu viele KI-Anfragen. Bitte in einer Stunde erneut versuchen." },
});

interface AiBgBody {
  kind?: string;
  style?: string;
  prompt?: string;
  count?: number;
}

const STYLE_PROMPTS: Record<string, string> = {
  "watercolor-floral":
    "soft hand-painted watercolor wedding stationery, blush-pink and sage-green wildflowers, eucalyptus, peonies, ranunculus, gentle bleed edges, romantic and airy, professional bridal magazine quality",
  "gold-art-deco":
    "elegant art-deco wedding card design, deep navy and ivory with thin geometric gold-foil lines, fans, sunbursts, mirrored borders, 1920s Gatsby refinement, luxury stationery",
  "minimal-modern":
    "ultra-minimalist editorial wedding invitation, pure off-white background with a single delicate hairline frame and one tiny abstract ink mark, plenty of negative space, Kinfolk magazine aesthetic",
  "boho-pampas":
    "boho beige wedding card design, dried pampas grass, palm leaves, terracotta and warm cream tones, hand-drawn texture, organic and earthy, Pinterest wedding inspiration",
  "vintage-ivory":
    "vintage parchment wedding invitation, aged ivory paper texture with subtle deckle edges, fine sepia botanical etching in the corners, classical engraving style",
  "wildflower-meadow":
    "loose wildflower meadow watercolor wedding stationery, scattered daisies, lavender, baby's breath, soft pastel palette, illustrative and joyful",
  "gold-monogram":
    "luxurious cream wedding card with delicate gold-foil laurel wreath and thin metallic line frame, refined classical sophistication, magazine-quality stationery",
  "moody-floral":
    "moody dark-romance wedding card, deep burgundy and forest green florals on charcoal background, oil-painting style, dramatic and intimate, dark academia wedding",
};

const KIND_LAYOUT_HINT: Record<CardKind, string> = {
  einladung:
    "portrait orientation wedding INVITATION card. Leave the entire center vertical band fully empty (no decoration, no marks at all) so a couple's names and date can be placed on top. Decoration must hug only the top, bottom and side margins.",
  tischkarte:
    "small landscape PLACE-CARD for wedding tables (90×55mm proportions). Keep the center totally clean for a guest name and table number. Tiny refined ornaments only in the top corners.",
  menuekarte:
    "tall portrait MENU card. Decorative ornaments only along the top header area and the bottom border. The whole middle is intentionally blank for course listings.",
  dankeskarte:
    "landscape THANK-YOU card. Left third reserved for a photo (leave it as a soft neutral rectangle area), the right two thirds intentionally clean for handwriting and signature. Floral or ornamental accents only along the outer edges.",
};

function buildPrompt(kind: CardKind, styleKey: string | undefined, custom: string | undefined): string {
  const styleDirective =
    (styleKey && STYLE_PROMPTS[styleKey]) ||
    custom?.slice(0, 400) ||
    STYLE_PROMPTS["watercolor-floral"];

  const [wMm, hMm] = KIND_SIZE_MM[kind];
  const orientation = wMm >= hMm ? "landscape" : "portrait";

  return [
    `Design ONE single elegant wedding-stationery card BACKGROUND artwork, ${orientation} ${wMm}x${hMm}mm aspect ratio.`,
    `Style: ${styleDirective}.`,
    `Layout: ${KIND_LAYOUT_HINT[kind]}`,
    `ABSOLUTELY DO NOT include ANY letters, words, text, names, dates, numbers, monograms, signatures, alphabets, lorem ipsum, or any typographic characters in the image.`,
    `No mockups, no card-on-table photos — produce ONLY the flat artwork itself that would print directly onto the card paper. Edge-to-edge.`,
    `High-end professional graphic-designer quality, suitable for a luxury bridal magazine.`,
  ].join(" ");
}

router.post("/ai/card-background", requireCustomer, aiLimiter, async (req, res): Promise<void> => {
  if (!isGeminiConfigured()) {
    res.status(503).json({ error: "KI-Bildgenerierung ist gerade nicht konfiguriert." });
    return;
  }
  const body = req.body as AiBgBody;
  const kind = body.kind;
  if (!kind || typeof kind !== "string" || !KIND_VALUES.has(kind as CardKind)) {
    res.status(400).json({ error: "Ungültiger Kartentyp." });
    return;
  }
  const styleKey = typeof body.style === "string" ? body.style : undefined;
  const customPrompt = typeof body.prompt === "string" ? body.prompt : undefined;
  if (styleKey && !STYLE_PROMPTS[styleKey] && !customPrompt) {
    res.status(400).json({ error: "Ungültiger Stil." });
    return;
  }
  const count = Math.min(Math.max(Number(body.count) || 3, 1), 3);
  const prompt = buildPrompt(kind as CardKind, styleKey, customPrompt);

  req.log.info({ kind, styleKey, count }, "Generating AI card backgrounds");

  try {
    const results = await Promise.all(
      Array.from({ length: count }).map(async () => {
        const { b64_json, mimeType } = await generateImage(prompt);
        return `data:${mimeType};base64,${b64_json}`;
      }),
    );
    res.json({ images: results });
  } catch (err) {
    req.log.error({ err }, "AI background generation failed");
    res.status(502).json({ error: "KI-Bildgenerierung gerade nicht verfügbar." });
  }
});

export default router;

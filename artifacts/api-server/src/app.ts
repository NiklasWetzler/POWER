import express, { type Express, type Request } from "express";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { ensureSuperAdmin } from "./lib/adminBootstrap";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

// ── Required secrets — fail-fast in production ─────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET;
if (isProd && (!SESSION_SECRET || SESSION_SECRET.length < 32)) {
  // Refuse to boot rather than run with a weak/known secret
  throw new Error("SESSION_SECRET must be set (>= 32 chars) in production.");
}

// Trust the Replit reverse proxy so secure cookies + rate-limit IPs work over HTTPS
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        let url = req.url?.split("?")[0] ?? "";
        // Redact secrets embedded in URL paths so they never leak into logs.
        // Add new sensitive routes here as they appear.
        url = url
          .replace(/^\/api\/admin-invite\/[^/]+/, "/api/admin-invite/:token")
          .replace(/^\/api\/admin-avatars\/[^/]+/, "/api/admin-avatars/:id")
          .replace(/^\/api\/customer-magic-link\/[^/]+/, "/api/customer-magic-link/:token");
        return { id: req.id, method: req.method, url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    // The frontend is served from the same origin; allow our own scripts/styles.
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "blob:", "https:"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "script-src": ["'self'"],
            "connect-src": ["'self'"],
            "frame-ancestors": ["'self'"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
  }),
);

// ── CORS: in production, only the configured Replit domains (+ custom domain) ──
const allowedOrigins = (process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)
  .map((d) => `https://${d}`);
if (process.env.PUBLIC_APP_ORIGIN) allowedOrigins.push(process.env.PUBLIC_APP_ORIGIN);

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin requests (no Origin header) and internal calls are fine
      if (!origin) return cb(null, true);
      if (!isProd) return cb(null, true); // permissive in dev
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: origin not allowed"));
    },
    credentials: true,
  }),
);

// ── Body parsers — modest limit; large PDF uploads use their own limit per route ──
// 1mb covers JSON payloads that embed a base64-encoded admin profile picture
// (the UI caps uploads at ~600 KB binary → ~820 KB base64). Larger media uploads
// still use their own per-route parsers.
// Card designs may carry a base64-encoded photo (Dankeskarte) up to ~6 MB binary.
app.use("/api/designs", express.json({ limit: "9mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Session store: Postgres-backed so sessions survive restarts/scale ──────
const PgSession = connectPgSimple(session);
let sessionStore: session.Store | undefined;
if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  // Bootstrap the session table ourselves. We can't rely on
  // connect-pg-simple's `createTableIfMissing` because it reads a SQL file
  // from disk, which is missing in our esbuild-bundled output.
  void pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);
  `).catch((err) => logger.error({ err }, "Failed to ensure session table"));

  sessionStore = new PgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: false,
  });
}

app.use(
  session({
    store: sessionStore,
    secret: SESSION_SECRET ?? "dev-only-insecure-secret-change-me",
    resave: false,
    saveUninitialized: false,
    name: "niwe.sid",
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// ── Rate limits on sensitive endpoints ──────────────────────────────────────
// Use the library's IPv6-safe helper so /64 subnets can't be used to bypass limits.
const keyByIp = (req: Request) => ipKeyGenerator(req.ip ?? "");

const authLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 min
  max: 10, // 10 login attempts / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { error: "Zu viele Login-Versuche. Bitte später erneut versuchen." },
});

const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60_000, // 1 h
  max: 20, // 20 public submissions / hour / IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
});

const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 30, // 30 chat messages / minute / IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIp,
  message: { error: "Zu viele Nachrichten. Bitte kurz warten." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/customer/login", authLimiter);
app.use("/api/questionnaire/submit", publicWriteLimiter);
app.use("/api/customer/chat", chatLimiter);
app.use("/api/customer/appointments", chatLimiter);

app.use("/api", router);

// Bootstrap the super-admin from env. In production we refuse to keep serving
// traffic if the bootstrap fails, otherwise the admin area could end up with no
// reachable super-admin account. In development we log and continue so an
// isolated DB hiccup doesn't lock you out of `pnpm dev`.
void ensureSuperAdmin().catch((err) => {
  logger.error({ err }, "ensureSuperAdmin failed at startup");
  if (process.env.NODE_ENV === "production") {
    // Give pino a tick to flush, then exit so the platform restarts us.
    setTimeout(() => process.exit(1), 250);
  }
});

export default app;

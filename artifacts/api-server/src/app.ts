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
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
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
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));

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

export default app;

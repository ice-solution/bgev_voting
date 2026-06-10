require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

const { config } = require("./lib/config");
const { ensureIndexes } = require("./lib/db");

const { webRouter } = require("./routes/web");
const { apiRouter } = require("./routes/api");

async function main() {
  await ensureIndexes();

  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    if (config.allowIframeCamera) {
      res.setHeader("Permissions-Policy", "camera=*");
    }
    if (config.frameAncestors) {
      res.setHeader("Content-Security-Policy", `frame-ancestors ${config.frameAncestors}`);
    }
    next();
  });

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(
    session({
      secret: config.sessionSecret || process.env.SESSION_SECRET || "dev-only",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: config.cookieSameSite,
        secure: config.cookieSecure
      }
    })
  );

  app.use((req, res, next) => {
    res.locals.baseUrl = config.baseUrl;
    res.locals.env = config.env;
    res.locals.surveyMinGames = config.surveyMinGames;
    res.locals.rsvpEventId = config.rsvpEventId;
    res.locals.staffTokenEnabled = Boolean(config.staffToken);
    res.locals.adminUser = req.session.adminUser || null;
    res.locals.staffGameId = req.session.staffGameId || null;
    res.locals.userId = req.session.userId || null;
    next();
  });

  app.use("/", webRouter);
  app.use("/api", apiRouter);

  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const wantsJson =
      req.path.startsWith("/api/") ||
      req.path.startsWith("/web/") ||
      req.get("accept")?.includes("application/json");
    if (wantsJson) {
      return res.status(status).json({
        ok: false,
        error: err.message || "Server error",
        details: err.details
      });
    }
    res.status(status).render("error", { status, message: err.message || "Server error" });
  });

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CMS running: ${config.baseUrl}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


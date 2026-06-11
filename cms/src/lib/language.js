const { config } = require("./config");
const { getDb } = require("./db");
const { normalizeLang } = require("./i18n");

const LANG_COOKIE = "lang";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure
  };
}

function setLanguageCookie(res, lang) {
  res.cookie(LANG_COOKIE, lang, cookieOptions());
}

async function persistUserLanguage(userId, lang) {
  const normalized = normalizeLang(lang);
  if (!userId || !normalized) return;
  const db = await getDb();
  await db.collection("users").updateOne(
    { userId },
    { $set: { language: normalized, updatedAt: new Date() } }
  );
}

async function loadUserLanguage(userId) {
  if (!userId) return null;
  const db = await getDb();
  const user = await db.collection("users").findOne({ userId }, { projection: { language: 1 } });
  return normalizeLang(user?.language);
}

async function applyLanguage(req, res, lang) {
  const normalized = normalizeLang(lang) || "zh";
  req.session.lang = normalized;
  setLanguageCookie(res, normalized);
  if (req.session.userId) {
    await persistUserLanguage(req.session.userId, normalized);
  }
  return normalized;
}

async function resolveLanguage(req) {
  const fromQuery = normalizeLang(req.query.lang);
  if (fromQuery) return fromQuery;

  const fromSession = normalizeLang(req.session.lang);
  if (fromSession) return fromSession;

  const fromCookie = normalizeLang(req.cookies?.[LANG_COOKIE]);
  if (fromCookie) return fromCookie;

  if (req.session.userId) {
    const fromDb = await loadUserLanguage(req.session.userId);
    if (fromDb) return fromDb;
  }

  const accept = String(req.headers["accept-language"] || "");
  if (/\ben\b/i.test(accept) && !/\bzh\b/i.test(accept)) return "en";

  return "zh";
}

function languageMiddleware() {
  return async (req, res, next) => {
    try {
      let lang = await resolveLanguage(req);

      if (req.query.lang && normalizeLang(req.query.lang)) {
        lang = await applyLanguage(req, res, req.query.lang);
      } else {
        req.session.lang = lang;
        setLanguageCookie(res, lang);
      }

      res.locals.lang = lang;
      res.locals.currentPath = req.originalUrl.split("?")[0] || "/";
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = {
  LANG_COOKIE,
  languageMiddleware,
  applyLanguage,
  persistUserLanguage,
  loadUserLanguage,
  setLanguageCookie
};

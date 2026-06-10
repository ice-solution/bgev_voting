const path = require("path");

function mustGet(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseCsv(v) {
  return String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  baseUrl: process.env.BASE_URL || `http://localhost:${Number(process.env.PORT || 8787)}`,
  sessionSecret: process.env.SESSION_SECRET || "",
  // 反向代理層數，production 預設 1（nginx）；本機預設不啟用
  trustProxy: (() => {
    const raw = process.env.TRUST_PROXY;
    if (raw === "false" || raw === "0") return false;
    if (raw === "true") return true;
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return process.env.NODE_ENV === "production" ? 1 : false;
  })(),

  mongoUri: mustGet("MONGODB_URI"),
  mongoDb: mustGet("MONGODB_DB"),

  rsvpDomain: mustGet("RSVP_DOMAIN"),
  rsvpEventId: mustGet("RSVP_EVENT_ID"),
  rsvpProtocol: process.env.RSVP_PROTOCOL || "",
  webApiKeys: parseCsv(process.env.WEB_API_KEYS),
  // 伺服器代用戶呼叫 RSVP API 時使用的 key（預設取 WEB_API_KEYS 第一個）
  rsvpApiKey: process.env.RSVP_API_KEY || parseCsv(process.env.WEB_API_KEYS)[0] || "",

  surveyMinGames: Number(process.env.SURVEY_MIN_GAMES || 3),

  adminUsername: mustGet("ADMIN_USERNAME"),
  adminPassword: mustGet("ADMIN_PASSWORD"),

  staffToken: process.env.STAFF_TOKEN || "",

  gamesPath: path.join(__dirname, "..", "data", "games.json"),

  // iframe 嵌入：跨網域時 session cookie 需 SameSite=None + Secure
  cookieSameSite: process.env.COOKIE_SAMESITE || "lax",
  cookieSecure: (() => {
    const baseUrl = process.env.BASE_URL || "";
    if (process.env.COOKIE_SECURE === "true") {
      return baseUrl.startsWith("https://");
    }
    if (process.env.COOKIE_SECURE === "false") return false;
    return process.env.NODE_ENV === "production" || baseUrl.startsWith("https://");
  })(),
  // 允許被哪些網站 iframe 嵌入，* 代表全部；例：https://parent.com https://www.parent.com
  frameAncestors: process.env.FRAME_ANCESTORS || "*",
  allowIframeCamera: process.env.ALLOW_IFRAME_CAMERA !== "false"
};

module.exports = { config };

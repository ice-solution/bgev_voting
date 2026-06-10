const fetch = require("node-fetch");
const { config } = require("./config");

function isAllowedWebApiKey(key) {
  if (!key) return false;
  if (!config.webApiKeys.length) return true;
  return config.webApiKeys.includes(key);
}

function normalizeRsvpDomain(raw) {
  let domain = String(raw || "").trim();
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/\/.*$/, "");
  return domain;
}

function getRsvpProtocol(domain) {
  if (config.rsvpProtocol) return config.rsvpProtocol;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(domain)) return "http";
  return "https";
}

function buildUserUrl(userId) {
  const encodedUserId = encodeURIComponent(String(userId));
  const domain = normalizeRsvpDomain(config.rsvpDomain);
  const protocol = getRsvpProtocol(domain);
  return `${protocol}://${domain}/web/${encodeURIComponent(config.rsvpEventId)}/users/${encodedUserId}`;
}

function getServerApiKey() {
  return config.rsvpApiKey || config.webApiKeys[0] || "";
}

async function fetchUserProfile({ userId, apiKey, skipKeyCheck = false }) {
  if (!skipKeyCheck && !isAllowedWebApiKey(apiKey)) {
    const err = new Error("WEB_API_KEY 無效");
    err.statusCode = 401;
    throw err;
  }

  const url = buildUserUrl(userId);
  const res = await fetch(url, {
    headers: {
      "X-WEB-API-KEY": apiKey
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`外部 API 失敗 (${res.status})`);
    err.statusCode = res.status;
    err.details = text;
    throw err;
  }

  return await res.json();
}

async function fetchUserProfileByServer(userId) {
  const apiKey = getServerApiKey();
  if (!apiKey) {
    const err = new Error("伺服器未設定 RSVP_API_KEY 或 WEB_API_KEYS");
    err.statusCode = 500;
    throw err;
  }
  return fetchUserProfile({ userId, apiKey, skipKeyCheck: true });
}

module.exports = {
  fetchUserProfile,
  fetchUserProfileByServer,
  isAllowedWebApiKey,
  buildUserUrl,
  getServerApiKey
};

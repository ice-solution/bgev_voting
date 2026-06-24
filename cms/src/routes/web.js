const express = require("express");
const { config } = require("../lib/config");
const { getGames, getGameById, getGamesByCategory, getGamesByStaffGroupId } = require("../lib/games");
const { getDb, clearAllData } = require("../lib/db");
const { fetchUserProfile, fetchUserProfileByServer } = require("../lib/rsvpApi");
const { extractProfileDisplay } = require("../lib/profile");
const { getSurveyAnswerIds, hasSurvey } = require("../lib/survey");
const { t, normalizeLang } = require("../lib/i18n");
const { applyLanguage, persistUserLanguage, loadUserLanguage, setLanguageCookie } = require("../lib/language");
const { isVotingOpen, getVotingStatus } = require("../lib/votingDeadline");

const webRouter = express.Router();

async function syncUserFromRsvp(req, userId) {
  const db = await getDb();
  const profile = await fetchUserProfileByServer(userId);
  await db.collection("users").updateOne(
    { userId },
    { $set: { userId, profile, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  const display = extractProfileDisplay(profile);
  req.session.userId = userId;
  req.session.userName = display.name;
  req.session.userCompany = display.company;
  return profile;
}

async function renderUserProfile(req, res, userId) {
  const db = await getDb();
  let profileError = null;
  let profile = null;

  try {
    profile = await syncUserFromRsvp(req, userId);
  } catch (e) {
    profileError = e.message;
    const cached = await db.collection("users").findOne({ userId });
    profile = cached?.profile || null;
  }

  const plays = await db.collection("plays").find({ userId }).toArray();
  const survey = await db.collection("surveys").findOne({ userId });
  const playedGameIds = new Set(plays.map((p) => Number(p.gameId)));
  const lang = res.locals.lang || "zh";
  const games = getGames(lang).map((g) => ({
    ...g,
    played: playedGameIds.has(Number(g.id))
  }));

  const display = extractProfileDisplay(profile);

  const answerGameIds = getSurveyAnswerIds(survey);
  const votedGames = games.filter((g) => answerGameIds.includes(Number(g.id)));

  res.render("user_profile", {
    userId,
    displayName: req.session.userName || display.name,
    displayCompany: req.session.userCompany || display.company,
    profileError,
    games,
    playedCount: plays.length,
    survey,
    votedGames,
    hasVoted: hasSurvey(survey),
    canSurvey: plays.length >= config.surveyMinGames,
    votingOpen: isVotingOpen(),
    voteDeadline: getVotingStatus(res.locals.lang || "zh")
  });
}

webRouter.get("/u/survey", async (req, res, next) => {
  try {
    if (!req.session.userId) return res.redirect("/u");
    const userId = req.session.userId;
    const db = await getDb();
    const playedCount = await db.collection("plays").countDocuments({ userId });
    if (playedCount < config.surveyMinGames) {
      return res.redirect("/u/profile");
    }
    const lang = res.locals.lang || req.session.lang || "zh";
    const voting = getVotingStatus(lang);
    if (!voting.open) {
      return res.redirect("/u/profile");
    }
    const survey = await db.collection("surveys").findOne({ userId });
    const selectedIds = getSurveyAnswerIds(survey);
    if (req.session.lang !== lang) req.session.lang = lang;
    if (req.session.userId) {
      await persistUserLanguage(req.session.userId, lang);
    }
    res.render("user_survey", {
      lang,
      categories: getGamesByCategory(lang, { votableOnly: true }),
      selectedIds,
      hasVoted: selectedIds.length > 0,
      surveyMaxVotes: config.surveyMaxVotes
    });
  } catch (e) {
    next(e);
  }
});

webRouter.get("/", (req, res) => {
  const lang = res.locals.lang || "zh";
  res.render("home", {
    categories: getGamesByCategory(lang, { votableOnly: true }),
    surveyMinGames: config.surveyMinGames,
    votingOpen: isVotingOpen(),
    voteDeadline: getVotingStatus(lang)
  });
});

webRouter.post("/set-language", async (req, res, next) => {
  try {
    const lang = normalizeLang(req.body.lang) || "zh";
    await applyLanguage(req, res, lang);
    const redirect = String(req.body.redirect || "/").trim() || "/";
    const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    res.redirect(safeRedirect);
  } catch (e) {
    next(e);
  }
});

webRouter.get("/web/:eventId/users/:userId", async (req, res, next) => {
  try {
    const apiKey = String(req.get("X-WEB-API-KEY") || "");
    const userId = String(req.params.userId);
    const profile = await fetchUserProfile({ userId, apiKey });
    const db = await getDb();
    await db.collection("users").updateOne(
      { userId },
      { $set: { userId, profile, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true, userId, profile });
  } catch (e) {
    next(e);
  }
});

webRouter.get("/u", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/u/profile");
  }
  res.render("user_lookup", { error: req.query.error || null });
});

function redirectWithSession(req, res, path) {
  const lang = req.session.lang || "zh";
  req.session.save((err) => {
    if (err) {
      return res.redirect("/u?error=" + encodeURIComponent(t(lang, "u.session_save_fail")));
    }
    res.redirect(path);
  });
}

async function syncUserLanguageOnLogin(req, res, userId) {
  const savedLang = await loadUserLanguage(userId);
  if (savedLang) {
    req.session.lang = savedLang;
    setLanguageCookie(res, savedLang);
    return;
  }
  if (req.session.lang) {
    await persistUserLanguage(userId, req.session.lang);
  }
}

webRouter.get("/u/enter/:userId", async (req, res) => {
  const lang = req.session.lang || "zh";
  const userId = String(req.params.userId).trim();
  if (!userId) {
    return res.redirect("/u?error=" + encodeURIComponent(t(lang, "u.invalid_qr")));
  }

  req.session.userId = userId;
  await syncUserLanguageOnLogin(req, res, userId);
  try {
    await syncUserFromRsvp(req, userId);
  } catch (_) {
    const db = await getDb();
    const cached = await db.collection("users").findOne({ userId });
    if (cached?.profile) {
      const display = extractProfileDisplay(cached.profile);
      req.session.userName = display.name;
      req.session.userCompany = display.company;
    }
  }
  if (req.session.lang) {
    await persistUserLanguage(userId, req.session.lang);
  }
  return redirectWithSession(req, res, "/u/profile");
});

webRouter.get("/u/profile", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/u");
    }
    await renderUserProfile(req, res, req.session.userId);
  } catch (e) {
    next(e);
  }
});

webRouter.get("/u/:userId", (req, res) => {
  res.redirect("/u/enter/" + encodeURIComponent(req.params.userId));
});

webRouter.post("/u/logout", (req, res) => {
  req.session.userId = null;
  req.session.userName = null;
  req.session.userCompany = null;
  res.redirect("/u");
});

function isStaffAuthed(req) {
  return Boolean(req.session.staffAuthed) || !config.staffToken;
}

function renderStaffPage(req, res, groupId, opts = {}) {
  const categoryGroup = getGamesByStaffGroupId(groupId);
  if (!categoryGroup) {
    return res.status(404).render("error", {
      status: 404,
      message: "組別不存在"
    });
  }
  return res.render("staff", {
    groupId: Number(groupId),
    categoryGroup,
    games: categoryGroup.games,
    categoryLabel: categoryGroup.categoryLabel,
    authed: isStaffAuthed(req),
    error: opts.error || null
  });
}

webRouter.get("/staff", (req, res) => {
  res.redirect("/staff/group/1");
});

webRouter.get("/staff/group/:groupId", (req, res) => {
  renderStaffPage(req, res, req.params.groupId);
});

webRouter.post("/staff/group/:groupId/login", (req, res) => {
  const groupId = req.params.groupId;
  const token = String(req.body.token || "");
  if (config.staffToken && token !== config.staffToken) {
    return renderStaffPage(req, res, groupId, { error: "Staff token 不正確" });
  }
  req.session.staffAuthed = true;
  return res.redirect("/staff/group/" + encodeURIComponent(groupId));
});

webRouter.post("/staff/logout", (req, res) => {
  const groupId = String(req.body.groupId || "1");
  req.session.staffAuthed = null;
  res.redirect("/staff/group/" + encodeURIComponent(groupId));
});

webRouter.get("/staff/:gameId", (req, res) => {
  res.redirect("/staff");
});

webRouter.get("/admin", (req, res) => {
  if (req.session.adminUser) return res.redirect("/admin/users");
  res.render("admin_login", { error: null });
});

webRouter.post("/admin/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  if (username !== config.adminUsername || password !== config.adminPassword) {
    return res.status(401).render("admin_login", { error: "帳號或密碼錯誤" });
  }
  req.session.adminUser = { username };
  return res.redirect("/admin/users");
});

webRouter.post("/admin/logout", (req, res) => {
  req.session.adminUser = null;
  res.redirect("/admin");
});

webRouter.get("/admin/users", async (req, res, next) => {
  try {
    if (!req.session.adminUser) return res.redirect("/admin");
    const db = await getDb();

    const users = await db.collection("users").find({}).sort({ updatedAt: -1 }).limit(5000).toArray();
    const playsAgg = await db
      .collection("plays")
      .aggregate([{ $group: { _id: "$userId", playedCount: { $sum: 1 } } }])
      .toArray();
    const surveyAgg = await db.collection("surveys").find({}).toArray();

    const playedMap = new Map(playsAgg.map((r) => [r._id, r.playedCount]));
    const surveyMap = new Map(surveyAgg.map((s) => [s.userId, s]));

    const rows = users.map((u) => {
      const display = extractProfileDisplay(u.profile);
      const survey = surveyMap.get(u.userId) || null;
      return {
        userId: u.userId,
        name: display.name,
        company: display.company,
        playedCount: playedMap.get(u.userId) || 0,
        survey,
        surveyAnswerCount: getSurveyAnswerIds(survey).length,
        updatedAt: u.updatedAt
      };
    });

    res.render("admin_users", {
      rows,
      cleared: req.query.cleared === "1",
      clearError: req.query.clear_error || null
    });
  } catch (e) {
    next(e);
  }
});

webRouter.post("/admin/clear-data", async (req, res) => {
  if (!req.session.adminUser) return res.redirect("/admin");

  const confirmText = String(req.body.confirmText || "").trim();
  const understood = req.body.understood === "on" || req.body.understood === "true";
  const password = String(req.body.password || "");

  if (!understood) {
    return res.redirect("/admin/users?clear_error=" + encodeURIComponent("請勾選確認你了解此操作無法復原"));
  }
  if (confirmText !== "DELETE ALL") {
    return res.redirect("/admin/users?clear_error=" + encodeURIComponent('請輸入正確確認文字「DELETE ALL」'));
  }
  if (password !== config.adminPassword) {
    return res.redirect("/admin/users?clear_error=" + encodeURIComponent("Admin 密碼不正確"));
  }

  try {
    await clearAllData();
    return res.redirect("/admin/users?cleared=1");
  } catch (e) {
    return res.redirect("/admin/users?clear_error=" + encodeURIComponent(e.message || "清除失敗"));
  }
});

webRouter.get("/admin/users/:userId", async (req, res, next) => {
  try {
    if (!req.session.adminUser) return res.redirect("/admin");
    const userId = String(req.params.userId);
    const db = await getDb();
    const user = await db.collection("users").findOne({ userId });
    const plays = await db.collection("plays").find({ userId }).toArray();
    const survey = await db.collection("surveys").findOne({ userId });

    const playedGameIds = new Set(plays.map((p) => Number(p.gameId)));
    const games = getGames().map((g) => ({
      ...g,
      played: playedGameIds.has(Number(g.id))
    }));

    const answerGameIds = getSurveyAnswerIds(survey);
    const votedGames = getGames().filter((g) => answerGameIds.includes(Number(g.id)));
    res.render("admin_user_detail", { userId, user, games, plays, survey, votedGames, answerGameIds });
  } catch (e) {
    next(e);
  }
});

webRouter.get("/admin/export.xlsx", async (req, res, next) => {
  try {
    if (!req.session.adminUser) return res.redirect("/admin");
    res.redirect("/api/admin/export.xlsx");
  } catch (e) {
    next(e);
  }
});

module.exports = { webRouter };

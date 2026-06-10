const express = require("express");
const { config } = require("../lib/config");
const { getGames, getGameById, getGamesByCategory } = require("../lib/games");
const { getDb } = require("../lib/db");
const { fetchUserProfile, fetchUserProfileByServer } = require("../lib/rsvpApi");
const { extractProfileDisplay } = require("../lib/profile");
const { getSurveyAnswerIds, hasSurvey } = require("../lib/survey");

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
  const games = getGames().map((g) => ({
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
    canSurvey: plays.length >= config.surveyMinGames
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
    const survey = await db.collection("surveys").findOne({ userId });
    const selectedIds = getSurveyAnswerIds(survey);
    res.render("user_survey", {
      categories: getGamesByCategory(),
      selectedIds,
      hasVoted: selectedIds.length > 0
    });
  } catch (e) {
    next(e);
  }
});

webRouter.get("/", (req, res) => {
  res.render("home", {
    categories: getGamesByCategory(),
    surveyMinGames: config.surveyMinGames
  });
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
  req.session.save((err) => {
    if (err) {
      return res.redirect("/u?error=" + encodeURIComponent("登入狀態儲存失敗，請再試一次"));
    }
    res.redirect(path);
  });
}

webRouter.get("/u/enter/:userId", async (req, res) => {
  const userId = String(req.params.userId).trim();
  if (!userId) {
    return res.redirect("/u?error=" + encodeURIComponent("無效的 QR Code"));
  }

  req.session.userId = userId;
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

webRouter.get("/staff/:gameId", (req, res) => {
  const gameId = Number(req.params.gameId);
  const game = getGameById(gameId);
  res.render("staff", { gameId, game, error: null });
});

webRouter.post("/staff/:gameId/login", (req, res) => {
  const gameId = Number(req.params.gameId);
  const token = String(req.body.token || "");
  if (config.staffToken && token !== config.staffToken) {
    return res.status(401).render("staff", {
      gameId,
      game: getGameById(gameId),
      error: "Staff token 不正確"
    });
  }
  req.session.staffGameId = gameId;
  return res.redirect(`/staff/${encodeURIComponent(gameId)}`);
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

    res.render("admin_users", { rows });
  } catch (e) {
    next(e);
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

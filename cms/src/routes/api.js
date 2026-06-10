const express = require("express");
const ExcelJS = require("exceljs");

const { config } = require("../lib/config");
const { getDb } = require("../lib/db");
const { fetchUserProfile } = require("../lib/rsvpApi");
const { getGames, getGameById } = require("../lib/games");
const { getSurveyAnswerIds } = require("../lib/survey");

const apiRouter = express.Router();

function requireStaff(req) {
  const gameId = Number(req.params.gameId);
  if (Number.isNaN(gameId) || !getGameById(gameId)) {
    const err = new Error("遊戲 id 無效");
    err.statusCode = 400;
    throw err;
  }

  if (config.staffToken) {
    const headerToken = String(req.get("X-STAFF-TOKEN") || "");
    const okByHeader = headerToken && headerToken === config.staffToken;
    const okBySession = Number(req.session.staffGameId) === gameId;
    if (!okByHeader && !okBySession) {
      const err = new Error("Staff 未授權");
      err.statusCode = 401;
      throw err;
    }
  }
  return gameId;
}

function requireAdmin(req) {
  if (!req.session.adminUser) {
    const err = new Error("Admin 未登入");
    err.statusCode = 401;
    throw err;
  }
}

apiRouter.get("/web/:eventId/users/:userId", async (req, res, next) => {
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

apiRouter.get("/user/:userId/status", async (req, res, next) => {
  try {
    const userId = String(req.params.userId);
    const db = await getDb();
    const plays = await db.collection("plays").find({ userId }).toArray();
    const survey = await db.collection("surveys").findOne({ userId });
    res.json({
      ok: true,
      userId,
      playedGameIds: plays.map((p) => Number(p.gameId)),
      playedCount: plays.length,
      canSurvey: plays.length >= config.surveyMinGames,
      survey
    });
  } catch (e) {
    next(e);
  }
});

apiRouter.post("/staff/:gameId/confirm", async (req, res, next) => {
  try {
    const gameId = requireStaff(req);
    const userId = String(req.body.userId || "").trim();
    if (!userId) {
      const err = new Error("缺少 userId");
      err.statusCode = 400;
      throw err;
    }

    const db = await getDb();
    await db.collection("plays").updateOne(
      { userId, gameId },
      { $setOnInsert: { userId, gameId, createdAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true, userId, gameId });
  } catch (e) {
    if (e.code === 11000) {
      return res.json({ ok: true, duplicated: true });
    }
    next(e);
  }
});

function requireUserSession(req) {
  if (!req.session.userId) {
    const err = new Error("請先掃描 QR Code 登入");
    err.statusCode = 401;
    throw err;
  }
  return String(req.session.userId);
}

apiRouter.post("/user/survey", async (req, res, next) => {
  try {
    const userId = requireUserSession(req);
    const rawIds = Array.isArray(req.body.answerGameIds) ? req.body.answerGameIds : [];
    const answerGameIds = [...new Set(rawIds.map((id) => Number(id)).filter((id) => getGameById(id)))];

    if (!answerGameIds.length) {
      const err = new Error("請至少選擇一個遊戲");
      err.statusCode = 400;
      throw err;
    }

    const db = await getDb();
    const playedCount = await db.collection("plays").countDocuments({ userId });
    if (playedCount < config.surveyMinGames) {
      const err = new Error(`未達填寫問卷資格（需完成 ${config.surveyMinGames} 個遊戲）`);
      err.statusCode = 403;
      throw err;
    }

    const existing = await db.collection("surveys").findOne({ userId });
    await db.collection("surveys").updateOne(
      { userId },
      {
        $set: { userId, answerGameIds, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    res.json({
      ok: true,
      userId,
      answerGameIds,
      updated: Boolean(existing)
    });
  } catch (e) {
    next(e);
  }
});

apiRouter.get("/admin/export.xlsx", async (req, res, next) => {
  try {
    requireAdmin(req);
    const db = await getDb();

    const games = getGames();
    const users = await db.collection("users").find({}).toArray();
    const plays = await db.collection("plays").find({}).toArray();
    const surveys = await db.collection("surveys").find({}).toArray();

    const playedByUser = new Map();
    for (const p of plays) {
      const arr = playedByUser.get(p.userId) || [];
      arr.push(Number(p.gameId));
      playedByUser.set(p.userId, arr);
    }
    const surveyByUser = new Map(surveys.map((s) => [s.userId, s]));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users");

    sheet.columns = [
      { header: "userId", key: "userId", width: 24 },
      { header: "playedCount", key: "playedCount", width: 12 },
      { header: "playedGameIds", key: "playedGameIds", width: 30 },
      { header: "surveyAnswerGameIds", key: "surveyAnswerGameIds", width: 24 },
      { header: "surveyAnswerGameNames", key: "surveyAnswerGameNames", width: 40 },
      { header: "surveyAnswerCount", key: "surveyAnswerCount", width: 12 },
      { header: "profile", key: "profile", width: 60 }
    ];

    for (const u of users) {
      const played = playedByUser.get(u.userId) || [];
      const survey = surveyByUser.get(u.userId) || null;
      const answerIds = getSurveyAnswerIds(survey);
      const answerGames = answerIds.map((id) => games.find((g) => Number(g.id) === id)).filter(Boolean);
      sheet.addRow({
        userId: u.userId,
        playedCount: played.length,
        playedGameIds: played.sort((a, b) => a - b).join(","),
        surveyAnswerGameIds: answerIds.join(","),
        surveyAnswerGameNames: answerGames.map((g) => g.name).join(" | "),
        surveyAnswerCount: answerIds.length,
        profile: u.profile ? JSON.stringify(u.profile) : ""
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="bgev_event_export.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

module.exports = { apiRouter };


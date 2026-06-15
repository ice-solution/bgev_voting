const fs = require("fs");
const { config } = require("./config");
const { normalizeLang, getCategoryLabel } = require("./i18n");

let cached;

function normalizeGameFields(game) {
  const g = { ...game };
  if (!g.name_zh && g.name) g.name_zh = g.name;
  if (!g.name_en && g.name) g.name_en = g.name;
  g.name = g.name_zh || g.name_en || g.name || "";
  return g;
}

function localizeGame(game, lang) {
  const g = normalizeGameFields(game);
  const l = normalizeLang(lang) || "zh";
  return {
    ...g,
    name: l === "en" ? g.name_en || g.name_zh : g.name_zh || g.name_en,
    categoryLabel: getCategoryLabel(g.category, l)
  };
}

function getGames(lang) {
  if (!cached) {
    const raw = fs.readFileSync(config.gamesPath, "utf8");
    cached = JSON.parse(raw).map(normalizeGameFields);
  }
  if (!lang) return cached;
  return cached.map((g) => localizeGame(g, lang));
}

function getGameById(id, lang) {
  const n = Number(id);
  const game = cached
    ? cached.find((g) => Number(g.id) === n)
    : getGames().find((g) => Number(g.id) === n);
  if (!game) return null;
  return lang ? localizeGame(game, lang) : normalizeGameFields(game);
}

const CATEGORY_ORDER = ["中學組1", "中學組2", "大專組"];

const STAFF_GROUP_MAP = {
  1: "中學組1",
  2: "中學組2",
  3: "大專組"
};

function getCategoryByStaffGroupId(groupId) {
  return STAFF_GROUP_MAP[Number(groupId)] || null;
}

function getGamesByStaffGroupId(groupId, lang) {
  const category = getCategoryByStaffGroupId(groupId);
  if (!category) return null;
  return getGamesByCategory(lang).find((g) => g.category === category) || null;
}

function getGamesByCategory(lang) {
  const games = getGames(lang);
  const map = new Map();
  for (const g of games) {
    const cat = g.category || "其他";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(g);
  }
  const ordered = CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({
    category,
    categoryLabel: getCategoryLabel(category, lang),
    games: map.get(category)
  }));
  for (const [category, items] of map) {
    if (!CATEGORY_ORDER.includes(category)) {
      ordered.push({
        category,
        categoryLabel: getCategoryLabel(category, lang),
        games: items
      });
    }
  }
  return ordered;
}

module.exports = {
  getGames,
  getGameById,
  getGamesByCategory,
  localizeGame,
  getCategoryByStaffGroupId,
  getGamesByStaffGroupId,
  STAFF_GROUP_MAP
};

const fs = require("fs");
const { config } = require("./config");
const { normalizeLang, getCategoryLabel } = require("./i18n");

let cached;

function normalizeGameFields(game) {
  const g = { ...game };
  if (!g.name_zh && g.name) g.name_zh = g.name;
  if (!g.name_en && g.name) g.name_en = g.name;
  if (!g.school_name_zh && g.school_name) g.school_name_zh = g.school_name;
  if (!g.school_name_en && g.school_name) g.school_name_en = g.school_name;
  g.name = g.name_zh || g.name_en || g.name || "";
  g.school_name = g.school_name_zh || g.school_name_en || g.school_name || "";
  return g;
}

function localizeGame(game, lang) {
  const g = normalizeGameFields(game);
  const l = normalizeLang(lang) || "zh";
  return {
    ...g,
    name: l === "en" ? g.name_en || g.name_zh : g.name_zh || g.name_en,
    school_name: l === "en" ? g.school_name_en || g.school_name_zh : g.school_name_zh || g.school_name_en,
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

const CATEGORY_ORDER = ["中學一組", "中學二組", "大專組"];

const STAFF_GROUP_MAP = {
  1: { category: "中學一組" },
  2: { category: "中學二組" },
  3: { category: "大專組" }
};

function getStaffGroupSpec(groupId) {
  return STAFF_GROUP_MAP[Number(groupId)] || null;
}

function getCategoryByStaffGroupId(groupId) {
  return getStaffGroupSpec(groupId)?.category || null;
}

function getGamesByStaffGroupId(groupId, lang) {
  const spec = getStaffGroupSpec(groupId);
  if (!spec) return null;

  const games = getGames(lang).filter((g) => g.category === spec.category);
  if (!games.length) return null;

  return {
    category: spec.category,
    categoryLabel: getCategoryLabel(spec.category, lang),
    games
  };
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

const fs = require("fs");
const { config } = require("./config");

let cached;

function getGames() {
  if (!cached) {
    const raw = fs.readFileSync(config.gamesPath, "utf8");
    cached = JSON.parse(raw);
  }
  return cached;
}

function getGameById(id) {
  const n = Number(id);
  return getGames().find((g) => Number(g.id) === n) || null;
}

const CATEGORY_ORDER = ["中學組1", "中學組2", "大專組"];

function getGamesByCategory() {
  const games = getGames();
  const map = new Map();
  for (const g of games) {
    const cat = g.category || "其他";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(g);
  }
  const ordered = CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({
    category,
    games: map.get(category)
  }));
  for (const [category, items] of map) {
    if (!CATEGORY_ORDER.includes(category)) {
      ordered.push({ category, games: items });
    }
  }
  return ordered;
}

module.exports = { getGames, getGameById, getGamesByCategory };


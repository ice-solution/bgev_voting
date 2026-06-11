const { MongoClient } = require("mongodb");
const { config } = require("./config");

let clientPromise;
let dbPromise;

async function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(config.mongoUri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = getClient().then((c) => c.db(config.mongoDb));
  }
  return dbPromise;
}

const DATA_COLLECTIONS = ["users", "plays", "surveys"];

async function ensureIndexes() {
  const db = await getDb();
  await db.collection("plays").createIndex({ userId: 1, gameId: 1 }, { unique: true });
  await db.collection("surveys").createIndex({ userId: 1 }, { unique: true });
  await db.collection("users").createIndex({ userId: 1 }, { unique: true });
}

async function clearAllData() {
  const db = await getDb();
  const deleted = {};
  for (const name of DATA_COLLECTIONS) {
    const result = await db.collection(name).deleteMany({});
    deleted[name] = result.deletedCount;
  }
  return deleted;
}

module.exports = { getDb, ensureIndexes, clearAllData, DATA_COLLECTIONS };

const { MongoClient } = require('mongodb');
const config = require('./dbConfig');

const userName = config.userName || '';
const password = config.password || '';
const hostname = config.hostname || '';
const databaseName = config.databaseName || 'bracketbuilder';

if (!userName || !password || !hostname) {
  console.warn('[database] dbConfig.js is not filled in yet. MongoDB calls will fail until credentials are added.');
}

const url = `mongodb+srv://${encodeURIComponent(userName)}:${encodeURIComponent(password)}@${hostname}`;
const client = new MongoClient(url);
let db;
let users;
let sessions;
let brackets;

async function connectToDatabase() {
  if (db) return db;
  await client.connect();
  db = client.db(databaseName);
  users = db.collection('users');
  sessions = db.collection('sessions');
  brackets = db.collection('brackets');

  await users.createIndex({ email: 1 }, { unique: true });
  await sessions.createIndex({ token: 1 }, { unique: true });
  await sessions.createIndex({ userId: 1 });
  await brackets.createIndex({ id: 1 }, { unique: true });
  await brackets.createIndex({ ownerId: 1, updatedAt: -1 });

  return db;
}

async function getUserByEmail(email) {
  return users.findOne({ email });
}

async function getUserById(id) {
  return users.findOne({ id });
}

async function createUser(user) {
  await users.insertOne(user);
  return user;
}

async function createSession(session) {
  await sessions.deleteMany({ userId: session.userId });
  await sessions.insertOne(session);
  return session;
}

async function getSessionByToken(token) {
  return sessions.findOne({ token });
}

async function deleteSessionByToken(token) {
  return sessions.deleteOne({ token });
}

async function saveBracket(bracket) {
  await brackets.updateOne(
    { id: bracket.id },
    { $set: bracket },
    { upsert: true }
  );
  return bracket;
}

async function getBracketById(id) {
  return brackets.findOne({ id });
}

async function listBracketsByOwner(ownerId) {
  return brackets.find({ ownerId }).sort({ updatedAt: -1 }).toArray();
}

async function deleteBracket(id, ownerId) {
  return brackets.deleteOne({ id, ownerId });
}

module.exports = {
  connectToDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  createSession,
  getSessionByToken,
  deleteSessionByToken,
  saveBracket,
  getBracketById,
  listBracketsByOwner,
  deleteBracket,
};

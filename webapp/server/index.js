const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const AUTH_COOKIE = 'token';
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'users.json');
const DIST_PATH = path.join(__dirname, '..', 'dist');

app.use(express.json());
app.use(cookieParser());

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { users: [], sessions: [] };
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function parseUsername(email) {
  return String(email || '').trim().split('@')[0] || 'user';
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  });
}

function getSessionUser(req) {
  const token = req.cookies[AUTH_COOKIE];
  if (!token) return null;

  const db = readDb();
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) return null;

  const user = db.users.find((entry) => entry.id === session.userId);
  return user || null;
}

function auth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  req.user = user;
  next();
}

app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).send({ message: 'Password must be at least 6 characters.' });
  }

  const db = readDb();
  const existing = db.users.find((user) => user.email === email);
  if (existing) {
    return res.status(409).send({ message: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    email,
    username: parseUsername(email),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);

  const token = uuidv4();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeDb(db);
  setAuthCookie(res, token);

  res.status(201).send({ user: sanitizeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const db = readDb();
  const user = db.users.find((entry) => entry.email === email);
  if (!user) {
    return res.status(401).send({ message: 'Invalid email or password.' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).send({ message: 'Invalid email or password.' });
  }

  db.sessions = db.sessions.filter((entry) => entry.userId !== user.id);
  const token = uuidv4();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeDb(db);
  setAuthCookie(res, token);

  res.send({ user: sanitizeUser(user) });
});

app.delete('/api/auth/logout', (req, res) => {
  const token = req.cookies[AUTH_COOKIE];
  if (token) {
    const db = readDb();
    db.sessions = db.sessions.filter((entry) => entry.token !== token);
    writeDb(db);
  }

  clearAuthCookie(res);
  res.send({ message: 'Logged out.' });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.send({ user: sanitizeUser(req.user) });
});

app.get('/api/protected', auth, (req, res) => {
  res.send({
    message: `Welcome ${req.user.username}, you reached a restricted endpoint.`,
    user: sanitizeUser(req.user),
  });
});

app.get('/api/health', (_req, res) => {
  res.send({ ok: true });
});

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

app.listen(PORT, () => {
  ensureDb();
  console.log(`Server listening on port ${PORT}`);
});

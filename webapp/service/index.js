const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.argv.length > 2 ? Number(process.argv[2]) : 4000;
const authCookieName = 'token';
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'users.json');

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

function ensureDataStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readData() {
  ensureDataStore();

  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { users: [], sessions: [] };
  }
}

function writeData(data) {
  ensureDataStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function createId() {
  return crypto.randomUUID();
}

function makeUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function getUsernameFromEmail(email) {
  return String(email || '').split('@')[0] || 'user';
}

function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
}

function getAuthUser(req) {
  const token = req.cookies[authCookieName];
  if (!token) return null;

  const data = readData();
  const session = data.sessions.find((entry) => entry.token === token);
  if (!session) return null;

  return data.users.find((entry) => entry.id === session.userId) || null;
}

function authCookie(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  req.user = user;
  next();
}

app.post('/api/auth/create', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required.' });
  }

  if (password.length < 4) {
    return res.status(400).send({ message: 'Password must be at least 4 characters.' });
  }

  const data = readData();
  const existingUser = data.users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).send({ message: 'User already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: createId(),
    email,
    username: getUsernameFromEmail(email),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const token = createId();
  data.users.push(user);
  data.sessions = data.sessions.filter((entry) => entry.userId !== user.id);
  data.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeData(data);
  setAuthCookie(res, token);

  return res.status(201).send({ user: makeUserResponse(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const data = readData();
  const user = data.users.find((entry) => entry.email === email);
  if (!user) {
    return res.status(401).send({ message: 'Invalid email or password.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).send({ message: 'Invalid email or password.' });
  }

  const token = createId();
  data.sessions = data.sessions.filter((entry) => entry.userId !== user.id);
  data.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  writeData(data);
  setAuthCookie(res, token);

  return res.send({ user: makeUserResponse(user) });
});

app.delete('/api/auth/logout', (req, res) => {
  const token = req.cookies[authCookieName];

  if (token) {
    const data = readData();
    data.sessions = data.sessions.filter((entry) => entry.token !== token);
    writeData(data);
  }

  clearAuthCookie(res);
  return res.send({ message: 'Logged out.' });
});

app.get('/api/auth/me', authCookie, (req, res) => {
  return res.send({ user: makeUserResponse(req.user) });
});

app.get('/api/protected', authCookie, (req, res) => {
  return res.send({
    message: `Welcome ${req.user.username}, you reached a restricted endpoint.`,
    user: makeUserResponse(req.user),
  });
});

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function getXmlTagValue(xml, tagName) {
  const match = String(xml || '').match(new RegExp(`<${tagName}>([\s\S]*?)<\/${tagName}>`, 'i'));
  return decodeXmlEntities(match?.[1] || '').trim();
}

app.get('/api/health', (_req, res) => {
  return res.send({ ok: true });
});

app.get(/^\/api\/.*/, (_req, res) => {
  return res.status(404).send({ message: 'Not found' });
});

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataStore();
app.listen(port, () => {
  console.log(`Service listening on port ${port}`);
});

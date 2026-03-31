const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const {
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
} = require('./database');
const { getSharing, canViewBracket, canEditBracket, describeAccess } = require('./access');

const app = express();
const port = process.argv.length > 2 ? Number(process.argv[2]) : 4000;
const authCookieName = 'token';

const http = require('http');
const { peerProxy } = require('./peerProxy');

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(express.static('public'));

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

async function getAuthUser(req) {
  const token = req.cookies[authCookieName];
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  return getUserById(session.userId);
}

async function authCookie(req, res, next) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).send({ message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function normalizeProgress(progress) {
  return {
    scores: progress?.scores && typeof progress.scores === 'object' ? progress.scores : {},
    sig: progress?.sig && typeof progress.sig === 'object' ? progress.sig : {},
  };
}

function normalizeBracketPayload(body, ownerId) {
  const id = String(body?.id || '').trim();
  const draft = body?.draft && typeof body.draft === 'object' ? body.draft : null;
  const progress = normalizeProgress(body?.progress);

  if (!id || !draft) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    draft,
    progress,
    sharing: draft?.sharing && typeof draft.sharing === 'object' ? draft.sharing : {},
    bracketName: String(draft?.bracketName || 'Untitled Bracket'),
    teamCount: Number(draft?.teamCount || 0),
    type: String(draft?.type || 'single'),
    mode: String(draft?.mode || ''),
    createdAt: String(body?.createdAt || now),
    updatedAt: now,
  };
}

app.post('/api/auth/create', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).send({ message: 'Email and password are required.' });
    }

    if (password.length < 4) {
      return res.status(400).send({ message: 'Password must be at least 4 characters.' });
    }

    const existingUser = await getUserByEmail(email);
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
    await createUser(user);
    await createSession({ token, userId: user.id, createdAt: new Date().toISOString() });
    setAuthCookie(res, token);

    return res.status(201).send({ user: makeUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).send({ message: 'Invalid email or password.' });
    }

    const token = createId();
    await createSession({ token, userId: user.id, createdAt: new Date().toISOString() });
    setAuthCookie(res, token);

    return res.send({ user: makeUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/auth/logout', async (req, res, next) => {
  try {
    const token = req.cookies[authCookieName];
    if (token) {
      await deleteSessionByToken(token);
    }
    clearAuthCookie(res);
    return res.send({ message: 'Logged out.' });
  } catch (error) {
    next(error);
  }
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

app.get('/api/brackets', authCookie, async (req, res, next) => {
  try {
    const brackets = await listBracketsByOwner(req.user.id);
    return res.send({
      brackets: brackets.map((b) => ({
        id: b.id,
        ownerId: b.ownerId,
        draft: b.draft,
        progress: normalizeProgress(b.progress),
        bracketName: b.bracketName,
        teamCount: b.teamCount,
        type: b.type,
        mode: b.mode,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/brackets', authCookie, async (req, res, next) => {
  try {
    const bracket = normalizeBracketPayload(req.body, req.user.id);
    if (!bracket) {
      return res.status(400).send({ message: 'Bracket id and draft are required.' });
    }

    const existing = await getBracketById(bracket.id);
    if (existing && existing.ownerId !== req.user.id) {
      return res.status(403).send({ message: 'You do not have access to this bracket.' });
    }
    if (existing && existing.ownerId === req.user.id) {
      return res.status(409).send({ message: 'Bracket already exists.' });
    }

    await saveBracket(bracket);
    return res.status(201).send({ bracket });
  } catch (error) {
    next(error);
  }
});

app.get('/api/brackets/:id', authCookie, async (req, res, next) => {
  try {
    const bracket = await getBracketById(req.params.id);
    if (!bracket) {
      return res.status(404).send({ message: 'Bracket not found.' });
    }
    if (!canViewBracket(req.user, bracket)) {
      return res.status(403).send({ message: 'You do not have access to this bracket.' });
    }

    return res.send({
      bracket: { ...bracket, progress: normalizeProgress(bracket.progress), sharing: getSharing(bracket) },
      access: describeAccess(req.user, bracket),
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/brackets/:id', authCookie, async (req, res, next) => {
  try {
    const existing = await getBracketById(req.params.id);
    if (!existing) {
      return res.status(404).send({ message: 'Bracket not found.' });
    }
    if (!canEditBracket(req.user, existing)) {
      return res.status(403).send({ message: 'You do not have access to edit this bracket.' });
    }

    const isOwner = existing.ownerId === req.user.id;
    if (!isOwner && req.body?.draft) {
      return res.status(403).send({ message: 'Only the bracket owner can change bracket settings.' });
    }

    const draft = isOwner && req.body?.draft && typeof req.body.draft === 'object' ? req.body.draft : existing.draft;
    const progress = req.body?.progress ? normalizeProgress(req.body.progress) : normalizeProgress(existing.progress);

    const updated = {
      ...existing,
      draft,
      progress,
      sharing: draft?.sharing && typeof draft.sharing === 'object' ? draft.sharing : existing.sharing,
      bracketName: String(draft?.bracketName || existing.bracketName || 'Untitled Bracket'),
      teamCount: Number(draft?.teamCount || existing.teamCount || 0),
      type: String(draft?.type || existing.type || 'single'),
      mode: String(draft?.mode || existing.mode || ''),
      updatedAt: new Date().toISOString(),
    };

    await saveBracket(updated);
    return res.send({
      bracket: { ...updated, progress: normalizeProgress(updated.progress), sharing: getSharing(updated) },
      access: describeAccess(req.user, updated),
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/brackets/:id', authCookie, async (req, res, next) => {
  try {
    const result = await deleteBracket(req.params.id, req.user.id);
    if (!result.deletedCount) {
      return res.status(404).send({ message: 'Bracket not found.' });
    }
    return res.send({ message: 'Bracket deleted.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (_req, res) => {
  return res.send({ ok: true });
});

app.get(/^\/api\/.*/, (_req, res) => {
  return res.status(404).send({ message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).send({
    message: err?.message || 'Internal server error.',
  });
});

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await connectToDatabase();

  const server = http.createServer(app);

  peerProxy(server);

  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start service:', error.message);
  process.exit(1);
});

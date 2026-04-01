const WebSocket = require('ws');
const { getSessionByToken, getUserById, getBracketById } = require('./database');
const { canViewBracket, canEditBracket } = require('./access');

function parseCookieHeader(header = '') {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const eqIndex = part.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = part.slice(0, eqIndex).trim();
      const value = decodeURIComponent(part.slice(eqIndex + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

async function resolveUser(req) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  return getUserById(session.userId);
}

function peerProxy(server) {
  const wss = new WebSocket.Server({ server });
  const connections = [];

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    const connection = {
      ws,
      user: null,
      bracketId: null,
    };

    connections.push(connection);

    // Resolve auth once, then reuse it for all messages
    const authReady = resolveUser(req);

    ws.on('message', async (message) => {
      try {
        const raw = message.toString();
        console.log('Server received raw message:', raw);

        const user = await authReady;
        if (!user) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Unauthorized',
            })
          );
          ws.close(1008, 'Unauthorized');
          return;
        }

        connection.user = user;

        const data = JSON.parse(raw);

        switch (data.type) {
          case 'join': {
            const bracketId = String(data.bracketId || '').trim();
            const bracket = await getBracketById(bracketId);

            if (!bracket || !canViewBracket(connection.user, bracket)) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'You do not have access to view this bracket.',
                  bracketId,
                })
              );
              return;
            }

            connection.bracketId = bracketId;

            ws.send(
              JSON.stringify({
                type: 'joined',
                bracketId,
              })
            );

            console.log(`Client joined bracket ${bracketId}`);
            break;
          }

          case 'update': {
            const bracketId = String(data.bracketId || '').trim();
            const bracket = await getBracketById(bracketId);

            if (!bracket || !canEditBracket(connection.user, bracket)) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'You do not have access to edit this bracket.',
                  bracketId,
                })
              );
              return;
            }

            if (connection.bracketId !== bracketId) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Join the bracket room before sending updates.',
                  bracketId,
                })
              );
              return;
            }

            connections.forEach((c) => {
              if (
                c !== connection &&
                c.bracketId === bracketId &&
                c.ws.readyState === WebSocket.OPEN
              ) {
                c.ws.send(JSON.stringify(data));
              }
            });

            console.log(`Broadcasted update for bracket ${bracketId}`);
            break;
          }

          default:
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      const index = connections.indexOf(connection);
      if (index >= 0) {
        connections.splice(index, 1);
      }
    });
  });
}

module.exports = { peerProxy };
const WebSocket = require('ws');

function peerProxy(server) {
  const wss = new WebSocket.Server({ server });

  const connections = [];

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    const connection = {
      ws,
      bracketId: null,
    };

    connections.push(connection);

    ws.on('message', (message) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join':
          connection.bracketId = data.bracketId;
          console.log(`Client joined bracket ${data.bracketId}`);
          break;

        case 'update':
          connections.forEach((c) => {
            if (
              c !== connection &&
              c.bracketId === connection.bracketId
            ) {
              c.ws.send(JSON.stringify(data));
            }
          });
          break;
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
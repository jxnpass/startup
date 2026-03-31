let socket;

export function connectSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
  };
}

export function joinBracket(bracketId) {
  socket.send(
    JSON.stringify({
      type: 'join',
      bracketId,
    })
  );
}

export function sendUpdate(bracketId, update) {
  socket.send(
    JSON.stringify({
      type: 'update',
      bracketId,
      update,
    })
  );
}
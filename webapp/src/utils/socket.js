let socket = null;
let messageHandlers = [];
let joinedBracketIds = new Set();
let pendingMessages = [];

function getSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}

function notifyMessageHandlers(data) {
  for (const handler of messageHandlers) {
    try {
      handler(data);
    } catch (error) {
      console.error("Socket handler error:", error);
    }
  }
}

function flushPendingMessages() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const stillPending = [];

  for (const msg of pendingMessages) {
    console.log("Flushing pending message:", msg);

    if (msg.type === "join") {
      socket.send(JSON.stringify(msg));
    } else if (msg.type === "update") {
      if (joinedBracketIds.has(msg.bracketId)) {
        socket.send(JSON.stringify(msg));
      } else {
        stillPending.push(msg);
      }
    } else {
      socket.send(JSON.stringify(msg));
    }
  }

  pendingMessages = stillPending;
}

export function connectSocket() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  socket = new WebSocket(getSocketUrl());

  socket.onopen = () => {
    console.log("WebSocket connected");
    flushPendingMessages();
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
    joinedBracketIds = new Set();
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received:", data);

      if (data.type === "joined" && data.bracketId) {
        joinedBracketIds.add(data.bracketId);
        flushPendingMessages();
      }

      notifyMessageHandlers(data);
    } catch (error) {
      console.error("Could not parse WebSocket message:", error);
    }
  };

  return socket;
}

export function joinBracket(bracketId) {
  connectSocket();

  const message = {
    type: "join",
    bracketId,
  };

  console.log("Sending join:", message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    pendingMessages.push(message);
  }
}

export function sendUpdate(bracketId, update) {
  connectSocket();

  const message = {
    type: "update",
    bracketId,
    update,
    sentAt: Date.now(),
  };

  console.log("Sending update:", message);

  if (
    socket.readyState === WebSocket.OPEN &&
    joinedBracketIds.has(bracketId)
  ) {
    socket.send(JSON.stringify(message));
  } else {
    pendingMessages.push(message);
  }
}

export function addSocketMessageHandler(handler) {
  messageHandlers.push(handler);

  return () => {
    messageHandlers = messageHandlers.filter((h) => h !== handler);
  };
}
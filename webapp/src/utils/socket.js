let socket = null;
let currentBracketId = null;
let messageHandlers = [];

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

export function connectSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  socket = new WebSocket(getSocketUrl());

  socket.onopen = () => {
    console.log("WebSocket connected");

    if (currentBracketId) {
      socket.send(
        JSON.stringify({
          type: "join",
          bracketId: currentBracketId,
        })
      );
    }
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      notifyMessageHandlers(data);
    } catch (error) {
      console.error("Could not parse WebSocket message:", error);
    }
  };

  return socket;
}

export function joinBracket(bracketId) {
  currentBracketId = bracketId;
  const activeSocket = connectSocket();

  if (activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(
      JSON.stringify({
        type: "join",
        bracketId,
      })
    );
  }
}

export function sendUpdate(bracketId, update) {
  const activeSocket = connectSocket();

  const payload = JSON.stringify({
    type: "update",
    bracketId,
    update,
    sentAt: Date.now(),
  });

  if (activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(payload);
  } else {
    activeSocket.addEventListener(
      "open",
      () => {
        activeSocket.send(payload);
      },
      { once: true }
    );
  }
}

export function addSocketMessageHandler(handler) {
  messageHandlers.push(handler);

  return () => {
    messageHandlers = messageHandlers.filter((h) => h !== handler);
  };
}
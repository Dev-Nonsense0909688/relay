import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

// server_id -> server ws
const servers = new Map();

// client ws -> server ws
const clientToServer = new Map();

// server ws -> client ws
const serverToClient = new Map();

wss.on("connection", ws => {
  ws.on("message", data => {
    const msg = data.toString();

    /* ---------------- HANDSHAKES ---------------- */

    // SERVER REGISTRATION
    if (msg.startsWith("__SERVER__:")) {
      const id = msg.split(":")[1];
      servers.set(id, ws);
      console.log(`Server registered: ${id}`);
      return;
    }

    // CLIENT SELECTS SERVER
    if (msg.startsWith("__SELECT__:")) {
      const id = msg.split(":")[1];
      const serverWs = servers.get(id);

      if (!serverWs || serverWs.readyState !== WebSocket.OPEN) {
        ws.send(`ERROR: server '${id}' not available`);
        return;
      }

      clientToServer.set(ws, serverWs);
      serverToClient.set(serverWs, ws);

      ws.send(`CONNECTED:${id}`);
      console.log(`Client linked to server: ${id}`);
      return;
    }

    /* ---------------- ROUTING ---------------- */

    // CLIENT → SERVER (command)
    if (clientToServer.has(ws)) {
      const serverWs = clientToServer.get(ws);
      if (serverWs.readyState === WebSocket.OPEN) {
        serverWs.send(msg); // instant forward
      }
      return;
    }

    // SERVER → CLIENT (feedback)
    if (serverToClient.has(ws)) {
      const clientWs = serverToClient.get(ws);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(msg); // instant return
      }
      return;
    }
  });

  ws.on("close", () => {
    // client cleanup
    if (clientToServer.has(ws)) {
      const serverWs = clientToServer.get(ws);
      clientToServer.delete(ws);
      serverToClient.delete(serverWs);
    }

    // server cleanup
    for (const [id, serverWs] of servers.entries()) {
      if (serverWs === ws) {
        servers.delete(id);
        serverToClient.delete(ws);
        console.log(`Server disconnected: ${id}`);
      }
    }
  });
});

console.log("Instant command relay running on port", PORT);

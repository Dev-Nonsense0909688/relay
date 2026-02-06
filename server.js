import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

// serverId -> server socket
const servers = new Map();

// client socket -> server socket
const clientToServer = new Map();

// server socket -> client socket
const serverToClient = new Map();

wss.on("connection", ws => {
  ws.on("message", data => {
    const msg = data.toString();

    /* -------- HANDSHAKE -------- */

    // Register server
    if (msg.startsWith("__SERVER__:")) {
      const id = msg.slice("__SERVER__:".length);
      servers.set(id, ws);
      console.log(`[SERVER] registered: ${id}`);
      return;
    }

    // Client selects server
    if (msg.startsWith("__SELECT__:")) {
      const id = msg.slice("__SELECT__:".length);
      const serverWs = servers.get(id);

      if (!serverWs || serverWs.readyState !== WebSocket.OPEN) {
        ws.send(`ERROR|server '${id}' not available`);
        return;
      }

      clientToServer.set(ws, serverWs);
      serverToClient.set(serverWs, ws);

      ws.send(`CONNECTED:${id}`);
      console.log(`[CLIENT] linked to server: ${id}`);
      return;
    }

    /* -------- ROUTING -------- */

    // Client → Server (command with ID)
    if (clientToServer.has(ws)) {
      const serverWs = clientToServer.get(ws);
      if (serverWs.readyState === WebSocket.OPEN) {
        serverWs.send(msg);
      }
      return;
    }

    // Server → Client (response with same ID)
    if (serverToClient.has(ws)) {
      const clientWs = serverToClient.get(ws);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(msg);
      }
      return;
    }
  });

  ws.on("close", () => {
    // Client cleanup
    if (clientToServer.has(ws)) {
      const serverWs = clientToServer.get(ws);
      clientToServer.delete(ws);
      serverToClient.delete(serverWs);
    }

    // Server cleanup
    for (const [id, serverWs] of servers.entries()) {
      if (serverWs === ws) {
        servers.delete(id);
        serverToClient.delete(ws);
        console.log(`[SERVER] disconnected: ${id}`);
      }
    }
  });
});

console.log("Render relay (ID-safe, bidirectional) running on port", PORT);

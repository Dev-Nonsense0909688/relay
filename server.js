import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

// server_id -> ws
const servers = new Map();

// client ws -> selected server_id
const clientSelection = new Map();

wss.on("connection", ws => {
  ws.on("message", msg => {
    msg = msg.toString();

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

      if (!servers.has(id)) {
        ws.send(`ERROR: server '${id}' not found`);
        return;
      }

      clientSelection.set(ws, id);
      ws.send(`CONNECTED:${id}`);
      console.log(`Client selected server: ${id}`);
      return;
    }

    // CLIENT → SERVER
    const targetId = clientSelection.get(ws);
    if (targetId && servers.get(targetId)?.readyState === WebSocket.OPEN) {
      servers.get(targetId).send(msg);
    }
  });

  ws.on("close", () => {
    // cleanup servers
    for (const [id, sock] of servers.entries()) {
      if (sock === ws) {
        servers.delete(id);
        console.log(`Server disconnected: ${id}`);
      }
    }

    clientSelection.delete(ws);
  });
});

console.log("Relay with server selection running on port", PORT);

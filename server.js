import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

let serverClient = null;
let normalClient = [];

wss.on("connection", ws => {
  ws.on("message", msg => {
    msg = msg.toString();

    // handshake
    if (msg === "__SERVER__") {
      serverClient = ws;
      console.log("Server client registered");
      return;
    }

    if (msg === "__CLIENT__") {
      normalClient.push(ws);
      console.log("Normal client registered");
      return;
    }

    if (ws === normalClient && serverClient?.readyState === WebSocket.OPEN) {
      serverClient.send(msg);
    }

    if (ws === serverClient && normalClient?.readyState === WebSocket.OPEN) {
      normalClient.send(msg);
    }
  });

  ws.on("close", () => {
    if (ws === serverClient) serverClient = null;
    if (ws === normalClient) normalClient = null;
    console.log("Connection closed");
  });
});

console.log("Role-based relay running on port", PORT);

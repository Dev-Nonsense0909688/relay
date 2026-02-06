import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", ws => {
  console.log("Client connected");

  ws.on("message", msg => {
    // broadcast to everyone
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});

console.log("Chat server running on port", PORT);

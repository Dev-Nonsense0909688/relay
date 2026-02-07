import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 10000 });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("client connected");

  ws.on("message", (msg) => {
    for (const c of clients) {
      if (c !== ws && c.readyState === c.OPEN) {
        c.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("client disconnected");
  });
});

console.log("relay running on port 10000");

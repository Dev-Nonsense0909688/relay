import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const server = http.createServer();

const wss = new WebSocketServer({ server });

let agent: WebSocket | null = null;
const clients = new Set<WebSocket>();

wss.on("connection", (ws, req) => {
    const path = req.url;

    // MACHINE CONNECTS
    if (path === "/agent") {
        console.log("Agent connected");
        agent = ws;

        ws.on("message", (data) => {
            clients.forEach(c => c.readyState === 1 && c.send(data));
        });

        ws.on("close", () => {
            console.log("Agent disconnected");
            agent = null;
        });
        return;
    }

    // USER CONNECTS
    if (path === "/client") {
        console.log("Client connected");
        clients.add(ws);

        ws.on("message", (data) => {
            if (agent && agent.readyState === 1)
                agent.send(data);
        });

        ws.on("close", () => {
            clients.delete(ws);
            console.log("Client disconnected");
        });
    }
});

server.listen(PORT, () => {
    console.log("Relay listening on", PORT);
});

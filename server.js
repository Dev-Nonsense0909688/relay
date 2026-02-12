import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const server = http.createServer();
const wss = new WebSocketServer({ server });

let agent = null;
const clients = new Set();

wss.on("connection", (ws, req) => {
    const path = req.url;

    // AGENT CONNECT
    if (path === "/agent") {
        console.log("Agent connected");
        agent = ws;

        ws.on("message", (data) => {
            for (const client of clients)
                if (client.readyState === 1)
                    client.send(data);
        });

        ws.on("close", () => {
            console.log("Agent disconnected");
            agent = null;
        });

        return;
    }

    // CLIENT CONNECT
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
    console.log("Relay running on port", PORT);
});

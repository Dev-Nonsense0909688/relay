import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;

const server = http.createServer();
const wss = new WebSocketServer({ server });

let agent = null;

// sessionId -> client socket
const sessions = new Map();

wss.on("connection", (ws, req) => {
    const path = req.url;

    // AGENT CONNECT
    if (path === "/agent") {
        console.log("Agent connected");
        agent = ws;

        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());

                // send output only to correct client
                if (msg.id && sessions.has(msg.id)) {
                    const client = sessions.get(msg.id);
                    if (client.readyState === 1)
                        client.send(JSON.stringify(msg));
                }
            } catch {}
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

        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());

                // register session
                if (msg.type === "open") {
                    sessions.set(msg.id, ws);
                }

                // remove session
                if (msg.type === "close") {
                    sessions.delete(msg.id);
                }

                // forward to agent
                if (agent && agent.readyState === 1) {
                    agent.send(JSON.stringify(msg));
                }

            } catch {}
        });

        ws.on("close", () => {
            // remove all sessions belonging to this socket
            for (const [id, sock] of sessions) {
                if (sock === ws) sessions.delete(id);
            }
            console.log("Client disconnected");
        });
    }
});

server.listen(PORT, () => {
    console.log("Relay running on port", PORT);
});

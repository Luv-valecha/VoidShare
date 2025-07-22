import { WebSocketServer } from "ws";
import http from "http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: "./frontend" });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  // Create HTTP server
  const server = http.createServer((req, res) => {
    handle(req, res); // Let Next.js handle frontend routes
  });

  // Attach WebSocket server to HTTP server
  const wss = new WebSocketServer({ server });

  const peers = new Map();

  wss.on("connection", (ws) => {
    let peerId = null;

    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message);

        if (msg.type === "register") {
          console.log(`${msg.peerId} connected`);
          peerId = msg.peerId;
          peers.set(peerId, ws);
        }

        if (msg.type === "signal") {
          if (!peers.has(msg.target)) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Peer ID ${msg.target} not found.`,
            }));
          } else {
            const targetWS = peers.get(msg.target);
            if (targetWS) {
              targetWS.send(JSON.stringify({
                type: msg.data?.type || "signal",
                from: peerId,
                data: msg.data,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Invalid message:", message.toString());
      }
    });

    ws.on("close", () => {
      if (peerId) peers.delete(peerId);
    });
  });

  // Start everything
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server + WebSocket + Next.js running on port ${PORT}`);
  });
});

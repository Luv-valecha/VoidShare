// server.js
import next from "next";
import http from "http";
import { WebSocketServer } from "ws";
import { parse } from "url";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: "./frontend" });
const handle = app.getRequestHandler();

const peers = new Map();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let peerId = null;

    ws.on("message", (message) => {
      try {
        const msg = JSON.parse(message);
        if (msg.type === "register") {
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
            const target = peers.get(msg.target);
            if (target) {
              target.send(JSON.stringify({
                type: msg.data?.type ?? "signal",
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

  server.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

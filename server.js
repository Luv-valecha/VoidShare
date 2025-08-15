// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const port = parseInt(process.env.PORT || "4000", 10); // 4000 for dev
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });
const peers = new Map();

wss.on("connection", (ws) => {
  let peerId = null;

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);

      if (msg.type === "register") {
        peerId = msg.peerId;
        peers.set(peerId, ws);
        console.log(`Peer registered: ${peerId}`);
      }

      if (msg.type === "signal") {
        if (!peers.has(msg.target)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: `Peer ID ${msg.target} not found.`,
            })
          );
        } else {
          const target = peers.get(msg.target);
          if (target) {
            target.send(
              JSON.stringify({
                type: msg.data?.type ?? "signal",
                from: peerId,
                data: msg.data,
              })
            );
          }
        }
      }
    } catch (err) {
      console.error("Invalid message:", message.toString());
    }
  });

  ws.on("close", () => {
    if (peerId) {
      peers.delete(peerId);
      console.log(`Peer disconnected: ${peerId}`);
    }
  });
});

// Example REST endpoint (optional)
app.get("/", (req, res) => {
  res.status(200).send("WebRTC signaling server is running!");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Signaling server ready on http://localhost:${port}`);
});

// server/index.js
//
// VoidShare signaling server.
//
// This process never sees file contents. Its only job is to let two peers
// find each other and exchange WebRTC handshake data (SDP offers/answers and
// ICE candidates) over a plain WebSocket connection so they can open a
// direct, encrypted peer-to-peer DataChannel between their browsers.

import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";

const PORT = parseInt(process.env.PORT || "4000", 10);

const app = express();
app.use(cors());

app.get("/", (_req, res) => {
  res.status(200).send("VoidShare signaling server is running.");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", peers: peers.size });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/** @type {Map<string, import("ws").WebSocket>} */
const peers = new Map();

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

wss.on("connection", (ws) => {
  let peerId = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.warn("Ignoring malformed message:", raw.toString());
      return;
    }

    switch (msg.type) {
      case "register": {
        peerId = msg.peerId;
        peers.set(peerId, ws);
        console.log(`Peer registered: ${peerId} (${peers.size} online)`);
        break;
      }

      case "signal": {
        const target = peers.get(msg.target);
        if (!target) {
          send(ws, {
            type: "error",
            message: `Peer ID "${msg.target}" not found.`,
          });
          return;
        }
        send(target, {
          type: msg.data?.type ?? "signal",
          from: peerId,
          data: msg.data,
        });
        break;
      }

      default:
        console.warn("Unknown message type:", msg.type);
    }
  });

  ws.on("close", () => {
    if (peerId && peers.get(peerId) === ws) {
      peers.delete(peerId);
      console.log(`Peer disconnected: ${peerId} (${peers.size} online)`);
    }
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error for peer ${peerId ?? "unknown"}:`, err.message);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`VoidShare signaling server listening on port ${PORT}`);
});

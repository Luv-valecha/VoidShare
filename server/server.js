import { WebSocketServer } from "ws";
import http from "http";

// Create a basic HTTP server so Render doesn't complain
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket signaling server");
});

// Listen on the environment-defined port
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP/WebSocket server running on port ${PORT}`);
});

// Attach WebSocket server to the HTTP server
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
          if (msg.data?.type === "answer" || msg.data?.type === "decline") {
            const offerer = peers.get(msg.target);
            if (offerer) {
              offerer.send(JSON.stringify({
                type: msg.data.type,
                from: peerId,
                data: msg.data,
              }));
            }
          } else {
            peers.get(msg.target).send(
              JSON.stringify({ type: "signal", from: peerId, data: msg.data })
            );
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

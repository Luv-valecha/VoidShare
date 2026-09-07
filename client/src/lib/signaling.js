// src/lib/signaling.js
//
// Thin wrapper around the signaling WebSocket + a single RTCPeerConnection /
// RTCDataChannel pair. This module owns all the mutable WebRTC state so the
// React layer can stay declarative.
//
// Fix note: the previous version only had the *offering* side send its
// public key as soon as the channel opened, while the *answering* side sent
// its key back reactively, only after receiving the other side's key. That
// meant "connected" (a signaling-level concept) could become true well
// before the DataChannel finished its own public-key handshake. If a user
// hit "Send File" in that window, `peerPublicKey` was still `null` and
// `crypto.subtle.deriveKey` threw:
//   "EcdhKeyDeriveParams: public: Must be a CryptoKey"
//
// Now both sides send their public key the instant their DataChannel opens,
// independent of anything the other side does, and `onChannelOpen` /
// `onPeerKeyReceived` are separate, explicit signals the UI can wait on.

const SESSION_PEER_ID = Math.random().toString(36).slice(2, 10);

const MAX_BUFFER_BYTES = 16 * 1024 * 1024; // 16 MB
const RESUME_THRESHOLD_BYTES = 64 * 1024; // 64 KB

let ws = null;
let peerConnection = null;
let dataChannel = null;
let remotePeerId = null;
let pendingOffer = null;
let pendingCandidates = [];
let sendQueue = [];
let sendingPaused = false;

export function getPeerId() {
  return SESSION_PEER_ID;
}

/** Connect to the signaling server. Resolves once the socket is open and registered. */
export function connectSignalingServer({ url, onSignal, onAccepted, onDeclined, onError }) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", peerId: SESSION_PEER_ID }));
      resolve();
    };

    ws.onerror = (err) => reject(err);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "signal":
          onSignal?.(msg.from, msg.data);
          break;
        case "answer":
          onAccepted?.(msg.from);
          onSignal?.(msg.from, msg.data);
          break;
        case "decline":
          onDeclined?.(msg.from);
          break;
        case "error":
          onError?.(msg.message);
          break;
        default:
          break;
      }
    };
  });
}

function sendSignal(targetId, data) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("Signaling socket not ready \u2014 signal not sent.");
    return;
  }
  ws.send(JSON.stringify({ type: "signal", target: targetId, data }));
}

function flushQueue() {
  while (!sendingPaused && sendQueue.length > 0) {
    const { chunk, resolve } = sendQueue.shift();

    if (dataChannel.bufferedAmount + byteLength(chunk) > MAX_BUFFER_BYTES) {
      sendingPaused = true;
      sendQueue.unshift({ chunk, resolve });
      break;
    }

    dataChannel.send(chunk);
    resolve();
  }
}

function byteLength(chunk) {
  return typeof chunk === "string" ? chunk.length : chunk.byteLength;
}

async function flushPendingCandidates() {
  const queued = pendingCandidates;
  pendingCandidates = [];
  for (const candidate of queued) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to add queued ICE candidate:", err);
    }
  }
}

function attachDataChannel(channel, handlers) {
  dataChannel = channel;
  dataChannel.binaryType = "arraybuffer";
  dataChannel.bufferedAmountLowThreshold = RESUME_THRESHOLD_BYTES;

  dataChannel.onopen = () => handlers.onChannelOpen?.();
  dataChannel.onmessage = (e) => handlers.onData?.(e.data);
  dataChannel.onclose = () => handlers.onChannelClose?.();
  dataChannel.onbufferedamountlow = () => {
    sendingPaused = false;
    flushQueue();
  };
}

/** Initiate a connection as the calling side. */
export async function initiateConnection(targetId, handlers) {
  remotePeerId = targetId;
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  attachDataChannel(peerConnection.createDataChannel("file"), handlers);

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) sendSignal(targetId, { candidate: e.candidate });
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendSignal(targetId, { sdp: offer });
}

/** Route an incoming signaling message (offer / answer / ICE candidate). */
export async function handleIncomingSignal(from, data, handlers) {
  if (!peerConnection) {
    remotePeerId = from;
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.ondatachannel = (event) => attachDataChannel(event.channel, handlers);

    peerConnection.onicecandidate = (e) => {
      if (e.candidate) sendSignal(from, { candidate: e.candidate });
    };
  }

  if (data.sdp?.type === "offer") {
    pendingOffer = { from, sdp: data.sdp };
    handlers.onOfferReceived?.(from);
    return;
  }

  if (data.sdp?.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    await flushPendingCandidates();
    return;
  }

  if (data.candidate) {
    if (peerConnection.remoteDescription?.type) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      pendingCandidates.push(data.candidate);
    }
  }
}

export async function acceptIncomingOffer(from) {
  if (!pendingOffer || pendingOffer.from !== from) return;

  await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOffer.sdp));
  await flushPendingCandidates();

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  sendSignal(from, { sdp: answer, type: "answer" });
  pendingOffer = null;
}

export function declineIncomingOffer(from) {
  sendSignal(from, { type: "decline" });
  pendingOffer = null;
}

/** Queue data (string or ArrayBuffer chunk) for sending over the open DataChannel. */
export function sendData(chunk) {
  if (dataChannel?.readyState !== "open") {
    return Promise.reject(new Error("DataChannel is not open."));
  }
  return new Promise((resolve) => {
    sendQueue.push({ chunk, resolve });
    flushQueue();
  });
}

export function isChannelOpen() {
  return dataChannel?.readyState === "open";
}

/** Tear everything down so a fresh connection can be started cleanly. */
export function closeConnection() {
  try {
    dataChannel?.close();
  } catch {
    /* already closed */
  }
  try {
    peerConnection?.close();
  } catch {
    /* already closed */
  }
  dataChannel = null;
  peerConnection = null;
  remotePeerId = null;
  pendingOffer = null;
  pendingCandidates = [];
  sendQueue = [];
  sendingPaused = false;
}

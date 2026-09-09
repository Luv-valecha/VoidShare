"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getPeerId,
  connectSignalingServer,
  initiateConnection,
  handleIncomingSignal,
  acceptIncomingOffer,
  declineIncomingOffer,
  sendData,
  closeConnection,
} from "@/lib/signaling";
import {
  generateECDHKeyPair,
  exportPublicKey,
  importPeerPublicKey,
  deriveSharedKey,
  generateFileKey,
  exportRawKey,
  importRawAESKey,
  encryptWithAES,
  decryptWithAES,
  hashFile,
  verifyBlobHash,
} from "@/lib/crypto";

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "https://voidshareserver.onrender.com";

const CHUNK_SIZE = 32 * 1024; // 32 KB, matches the DataChannel backpressure settings.

/**
 * Everything VoidShare's UI needs: connection state, the ECDH key exchange,
 * and the encrypt/chunk/send + receive/decrypt file pipeline.
 *
 * Key-exchange fix: `keysReady` only becomes true once we hold BOTH our own
 * ECDH key pair AND the peer's public key. Sending is gated on this flag
 * instead of on `connected` (a purely signaling-level state), which is what
 * previously let people hit "Send File" before the peer's public key had
 * actually arrived over the DataChannel.
 */
export function useVoidShare() {
  const [myId, setMyId] = useState("");
  const [friendId, setFriendId] = useState("");
  const [connected, setConnected] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [peerPublicKey, setPeerPublicKey] = useState(null);
  const [readyForUse, setReadyForUse] = useState(false); // signaling connected + own keys generated

  const [selectedFile, setSelectedFile] = useState(null);
  const [incomingFile, setIncomingFile] = useState(null);
  const [receivedChunks, setReceivedChunks] = useState([]);

  const [encrypting, setEncrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [receivingProgress, setReceivingProgress] = useState(0);

  const keyPairRef = useRef({ privateKey: null, publicKey: null });
  const peerPublicKeyRef = useRef(null);
  const incomingFileRef = useRef(null);
  const connectedRef = useRef(false);

  const keysReady = Boolean(keyPairRef.current.privateKey && peerPublicKey);

  const sendPublicKey = useCallback(async () => {
    const { publicKey } = keyPairRef.current;
    if (!publicKey) return;
    const raw = await exportPublicKey(publicKey);
    await sendData(JSON.stringify({ type: "publicKey", key: raw }));
  }, []);

  const resetSession = useCallback((reason) => {
    setConnected(false);
    connectedRef.current = false;
    setChannelOpen(false);
    setFriendId("");
    setReceivedChunks([]);
    setIncomingFile(null);
    incomingFileRef.current = null;
    setSelectedFile(null);
    setSendingProgress(0);
    setReceivingProgress(0);
    setIsSending(false);
    setIsReceiving(false);
    setPeerPublicKey(null);
    peerPublicKeyRef.current = null;
    if (reason) toast.info(reason);
  }, []);

  const handleData = useCallback(
    async (data) => {
      if (typeof data === "string") {
        if (data === "__END__") {
          toast.success("File received!");
          setIsReceiving(false);
          setReceivingProgress(100);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          console.warn("Non-JSON string received:", data);
          return;
        }

        if (parsed.type === "metadata") {
          setIsReceiving(true);
          setReceivingProgress(0);
          setReceivedChunks([]);
          const fileMeta = {
            name: parsed.name,
            type: parsed.fileType,
            size: parsed.size,
            keyIV: parsed.keyIV,
            encryptedAESKey: parsed.encryptedAESKey,
            fileIV: parsed.fileIV,
            hash: parsed.hash,
          };
          setIncomingFile(fileMeta);
          incomingFileRef.current = fileMeta;
        } else if (parsed.type === "publicKey") {
          const imported = await importPeerPublicKey(parsed.key);
          setPeerPublicKey(imported);
          peerPublicKeyRef.current = imported;
        } else if (parsed.type === "disconnect") {
          resetSession("Peer disconnected.");
        }
        return;
      }

      // Binary chunk of an incoming file.
      setReceivedChunks((prev) => {
        const updated = [...prev, data];
        if (incomingFileRef.current?.size) {
          const receivedSize = updated.reduce((acc, c) => acc + c.byteLength, 0);
          setReceivingProgress(Math.min(100, (receivedSize / incomingFileRef.current.size) * 100));
        }
        return updated;
      });
    },
    [resetSession]
  );

  const channelHandlers = useCallback(
    () => ({
      onChannelOpen: () => {
        setChannelOpen(true);
        // Fixed: send our public key the moment the channel opens, on BOTH
        // sides, instead of only the calling side doing this eagerly.
        sendPublicKey();
      },
      onChannelClose: () => setChannelOpen(false),
      onData: handleData,
      onOfferReceived: (from) => {
        toast(
          ({ closeToast }) => (
            <div className="p-1">
              <p className="font-medium text-sm">
                Connection request from <b className="text-[var(--c-accent-soft)]">{from}</b>
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    acceptIncomingOffer(from);
                    setConnected(true);
                    connectedRef.current = true;
                    setFriendId(from);
                    closeToast();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    declineIncomingOffer(from);
                    closeToast();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--c-surface-2)] text-[var(--c-text)] hover:bg-[var(--c-accent-strong)] hover:text-white rounded-md transition"
                >
                  Decline
                </button>
              </div>
            </div>
          ),
          { autoClose: false }
        );
      },
    }),
    [handleData, sendPublicKey]
  );

  // --- Initial setup: warm the socket, generate our keys ---------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMyId(getPeerId());

      try {
        await connectSignalingServer({
          url: SIGNALING_URL,
          onSignal: (from, data) => handleIncomingSignal(from, data, channelHandlers()),
          onAccepted: (from) => {
            toast.success(`\u2705 ${from} accepted your connection request`);
            setConnected(true);
            connectedRef.current = true;
          },
          onDeclined: (from) => {
            toast.error(`\u274c ${from} declined your connection request`);
            setConnected(false);
            connectedRef.current = false;
          },
          onError: (message) => toast.error(message || "Connection failed."),
        });
      } catch (err) {
        console.error("Failed to connect to signaling server:", err);
        toast.error("Failed to connect to the signaling server.");
      }

      const keyPair = await generateECDHKeyPair();
      if (cancelled) return;
      keyPairRef.current = keyPair;

      setReadyForUse(true);
    })();

    const handleBeforeUnload = () => {
      if (connectedRef.current) {
        sendData(JSON.stringify({ type: "disconnect" })).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Auto-connect via ?peerId=... share links -------------------------
  useEffect(() => {
    if (!readyForUse) return;
    const params = new URLSearchParams(window.location.search);
    const peerId = params.get("peerId");
    if (!peerId) return;

    if (peerId === myId) {
      toast.warn("That share link points to your own Peer ID \u2014 ignoring it.");
      return;
    }

    setFriendId(peerId);
    toast.info(`Connecting to peer: ${peerId}`);
    initiateConnection(peerId, channelHandlers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyForUse]);

  const handleConnect = useCallback(() => {
    const trimmed = friendId.trim();
    if (!trimmed) {
      toast.warn("Enter a peer ID first.");
      return;
    }
    if (trimmed === myId) {
      toast.warn("You can't connect to your own Peer ID \u2014 share it with someone else instead.");
      return;
    }
    initiateConnection(trimmed, channelHandlers());
  }, [friendId, myId, channelHandlers]);

  const disconnectPeer = useCallback(() => {
    sendData(JSON.stringify({ type: "disconnect" })).catch(() => {});
    closeConnection();
    resetSession("Disconnected.");
  }, [resetSession]);

  const handleFileSend = useCallback(async () => {
    if (!selectedFile) return;

    if (!keysReady) {
      toast.info("Still setting up your secure channel \u2014 try again in a second.");
      return;
    }

    setEncrypting(true);
    try {
      const fileHash = await hashFile(selectedFile);
      const buffer = await selectedFile.arrayBuffer();

      const fileKey = await generateFileKey();
      const { iv: fileIV, encrypted } = await encryptWithAES(fileKey, buffer);
      const rawFileKey = await exportRawKey(fileKey);

      const sharedKey = await deriveSharedKey(
        keyPairRef.current.privateKey,
        peerPublicKeyRef.current
      );
      const { iv: keyIV, encrypted: encryptedFileKey } = await encryptWithAES(sharedKey, rawFileKey);

      await sendData(
        JSON.stringify({
          type: "metadata",
          name: selectedFile.name,
          fileType: selectedFile.type,
          size: selectedFile.size,
          keyIV: Array.from(keyIV),
          encryptedAESKey: Array.from(new Uint8Array(encryptedFileKey)),
          fileIV: Array.from(fileIV),
          hash: fileHash,
        })
      );
      setEncrypting(false);

      setIsSending(true);
      setSendingProgress(0);

      for (let offset = 0; offset < encrypted.byteLength; offset += CHUNK_SIZE) {
        const chunk = encrypted.slice(offset, offset + CHUNK_SIZE);
        await sendData(chunk);
        setSendingProgress(Math.min(100, ((offset + CHUNK_SIZE) / encrypted.byteLength) * 100));
      }

      await sendData("__END__");
      setIsSending(false);
      setSelectedFile(null);
      toast.success("File sent!");
    } catch (err) {
      console.error("Error in handleFileSend:", err);
      toast.error(`Couldn't send the file: ${err.message || err}`);
    } finally {
      setEncrypting(false);
      setIsSending(false);
    }
  }, [selectedFile, keysReady]);

  const handleDownload = useCallback(async () => {
    if (!incomingFile) {
      toast.error("No file metadata available yet.");
      return;
    }
    if (!keysReady) {
      toast.error("Secure channel isn't ready \u2014 can't decrypt yet.");
      return;
    }

    try {
      const sharedKey = await deriveSharedKey(
        keyPairRef.current.privateKey,
        peerPublicKeyRef.current
      );
      const rawFileKeyBuffer = await decryptWithAES(
        sharedKey,
        new Uint8Array(incomingFile.encryptedAESKey).buffer,
        new Uint8Array(incomingFile.keyIV)
      );
      const fileKey = await importRawAESKey(rawFileKeyBuffer);

      const validChunks = receivedChunks.filter((c) => c instanceof ArrayBuffer);
      const encryptedBuffer = await new Blob(validChunks).arrayBuffer();
      const decryptedBuffer = await decryptWithAES(
        fileKey,
        encryptedBuffer,
        new Uint8Array(incomingFile.fileIV)
      );
      const decryptedBlob = new Blob([decryptedBuffer]);

      const verified = await verifyBlobHash(decryptedBlob, incomingFile.hash);
      if (!verified) {
        toast.error("File integrity check failed \u2014 the file may be corrupted.");
        return;
      }

      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = incomingFile.name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("\u2705 File decrypted and downloaded.");
    } catch (err) {
      console.error("Error in handleDownload:", err);
      toast.error(`Couldn't decrypt the file: ${err.message || err}`);
    }
  }, [incomingFile, keysReady, receivedChunks]);

  return {
    myId,
    friendId,
    setFriendId,
    connected,
    channelOpen,
    keysReady,
    readyForUse,
    selectedFile,
    setSelectedFile,
    incomingFile,
    receivedChunks,
    encrypting,
    isSending,
    isReceiving,
    sendingProgress,
    receivingProgress,
    handleConnect,
    disconnectPeer,
    handleFileSend,
    handleDownload,
  };
}

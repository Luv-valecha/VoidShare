"use client"

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getPeerId,
  connectserver,
  createConnection,
  handleSignal,
  sendChunk,
  acceptOffer,
  declineOffer,
} from "../lib/server_utils";
import { decryptWithAES, deriveSharedKey, encryptWithAES, exportAESKey, generateAESKey, importAESKey, computeFileHash, verifyFileHash } from "@/lib/crypto_utils";
import Link from "next/link";
import QrCode from "@/components/QrCode.js";

export default function Home() {
  const [myId, setMyId] = useState("");
  const [friendId, setFriendId] = useState("");
  const [receivedChunks, setReceivedChunks] = useState([]);
  const [incomingFile, setIncomingFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [peerPublicKey, setPeerPublicKey] = useState(null);
  const peerKeyReceivedRef = useRef(false);
  const myKeySentRef = useRef(false);

  const [sendingProgress, setSendingProgress] = useState(0);
  const [receivingProgress, setReceivingProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [copying, setCopying] = useState(false);
  const [encrypting, setEncrypting] = useState(false);

  const [backendReady, setBackendReady] = useState(true);
  const [setupdone, setSetupdone] = useState(false);
  const incomingFileRef = useRef(null);

  useEffect(() => {
    setBackendReady(false);
    (async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "https://voidshareserver.onrender.com");
      } catch (err) {
        console.error("Error connecting to backend:", err);
        toast.error("Failed to connect to backend. Please try again later.");
      } finally {
        setBackendReady(true);
      }
    })();
  }, [])

  useEffect(() => {
    const setup = async () => {
      setMyId(getPeerId());

      // Wait for WebSocket connection to be established
      await connectserver(
        (from, data) => {
          handleSignal(from, data, handleData, handleOffer);
        },
        (status, from) => {
          if (status === "accepted") {
            toast.success(`✅ ${from} accepted your connection request`);
            setConnected(true);
          } else if (status === "declined") {
            toast.error(`❌ ${from} declined your connection request`);
            setConnected(false);
          }
        }
      );

      window.showConnectionError = (message) => {
        toast.error(message || "Connection failed.");
      };

      const generateKeys = async () => {
        const keyPair = await crypto.subtle.generateKey(
          {
            name: "ECDH",
            namedCurve: "P-256",
          },
          true,
          ["deriveKey"]
        );
        setPrivateKey(keyPair.privateKey);
        setPublicKey(keyPair.publicKey);
      };

      await generateKeys();
      setSetupdone(true);
    };

    setup();

    const handleBeforeUnload = () => {
      if (connected) {
        sendChunk(JSON.stringify({ type: "disconnect" }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (
      peerKeyReceivedRef.current &&
      publicKey &&
      privateKey &&
      !myKeySentRef.current
    ) {
      (async () => {
        const exported = await crypto.subtle.exportKey("raw", publicKey);
        sendChunk(JSON.stringify({
          type: "publicKey",
          key: Array.from(new Uint8Array(exported)),
        }));
        myKeySentRef.current = true;
        // console.log("✅ Sent my public key back to peer (from useEffect)");
      })();
    }
  }, [publicKey, peerPublicKey, privateKey]);

  useEffect(() => {
    if (!setupdone) return;
    const searchParams = new URLSearchParams(window.location.search);
    const peerId = searchParams.get("peerId");
    if (peerId) {
      setFriendId(peerId);
      toast.info(`Connecting to peer: ${peerId}`);
      createConnection(peerId, handleData, async (ready) => {
        if (ready) toast("Ready to send file!");

        const exported = await crypto.subtle.exportKey("raw", publicKey);
        await sendChunk(JSON.stringify({
          type: "publicKey",
          key: Array.from(new Uint8Array(exported))
        }));
      });
    }
  }, [setupdone]);

  const handleOffer = (from) => {
    toast(({ closeToast }) => (
      <div className="p-4">
        <p className="font-medium">Connection request from <b>{from}</b></p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              acceptOffer(from);
              setConnected(true);
              setFriendId(from);
              closeToast();
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={() => {
              declineOffer(from);
              setConnected(false);
              closeToast();
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decline
          </button>
        </div>
      </div>
    ));
  };

  const handleData = async (data) => {
    if (typeof data === "string") {
      if (data === "__END__") {
        toast.success("File received!");
        setIsReceiving(false);
        setReceivingProgress(100);
      } else {
        try {
          const parsed = JSON.parse(data);

          if (parsed.type === "metadata") {
            setIsReceiving(true);
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
          }


          else if (parsed.type === "publicKey") {

            const senderKeyBytes = new Uint8Array(parsed.key);
            const importedKey = await crypto.subtle.importKey(
              "raw",
              senderKeyBytes,
              {
                name: "ECDH",
                namedCurve: "P-256",
              },
              true,
              []
            );
            setPeerPublicKey(importedKey);
            peerKeyReceivedRef.current = true;
          }

          else if (parsed.type === "disconnect") {
            setConnected(false);
            setFriendId("");
            setReceivedChunks([]);
            setIncomingFile(null);
            setSelectedFile(null);
            setPeerPublicKey(null);
            peerKeyReceivedRef.current = false;
            myKeySentRef.current = false;

            toast.warn("Peer disconnected.");
          }


        } catch (err) {
          toast.warn("Non-JSON string received:", data);
        }
      }
      return;
    }
    // Binary chunk
    setReceivedChunks((prev) => {
      const updated = [...prev, data];
      if (incomingFileRef.current?.size) {
        const receivedSize = updated.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const percentage = Math.min(100, (receivedSize / incomingFileRef.current.size) * 100);
        setReceivingProgress(percentage);
      }
      return updated;
    });
  };


  const handleConnect = () => {
    createConnection(friendId, handleData, async (ready) => {
      if (ready) toast("Ready to send file!");

      const exported = await crypto.subtle.exportKey("raw", publicKey);
      sendChunk(JSON.stringify({ type: "publicKey", key: Array.from(new Uint8Array(exported)) }));
    });
  };

  const handleFileSend = async () => {
    if (!selectedFile) return;

    setEncrypting(true);
    try {
      const fileHash = await computeFileHash(selectedFile);
      const buffer = await selectedFile.arrayBuffer();

      const aesKey = await generateAESKey();
      const { iv, encrypted } = await encryptWithAES(aesKey, buffer);

      const rawAesKey = await exportAESKey(aesKey);
      if (!peerPublicKey) {
      }
      const sharedKey = await deriveSharedKey(privateKey, peerPublicKey);
      const { iv: KeyIV, encrypted: encryptedAESKey } = await encryptWithAES(sharedKey, rawAesKey);

      sendChunk(JSON.stringify({
        type: "metadata",
        name: selectedFile.name,
        fileType: selectedFile.type,
        size: selectedFile.size,
        keyIV: Array.from(KeyIV),
        encryptedAESKey: Array.from(new Uint8Array(encryptedAESKey)),
        fileIV: Array.from(iv),
        hash: fileHash,
      }));
      setEncrypting(false);

      const chunkSize = 32 * 1024;
      setIsSending(true);
      setSendingProgress(0);

      for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
        const chunk = encrypted.slice(offset, offset + chunkSize);
        sendChunk(chunk);

        const percent = Math.min(100, (offset + chunkSize) / encrypted.byteLength * 100);
        setSendingProgress(percent);
        await new Promise(r => setTimeout(r, 10));

      }

      sendChunk("__END__");
      setIsSending(false);
      setSelectedFile(null);
      toast.success("File sent!");
    } catch (err) {
      toast.error(`Error in handleFileSend: ${err}`);
    } finally {
      setEncrypting(false);
    }
  };

  async function decryptFile(blob, aesKey, ivArray) {
    const iv = new Uint8Array(ivArray);
    const encryptedBuffer = await blob.arrayBuffer();

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encryptedBuffer
    );

    return new Blob([decryptedBuffer]);
  }


  const handleDownload = async () => {
    if (!incomingFile) return toast.error("No metadata available");

    const sharedKey = await deriveSharedKey(privateKey, peerPublicKey);
    const rawAesKeyBuffer = await decryptWithAES(
      sharedKey,
      new Uint8Array(incomingFile.encryptedAESKey).buffer,
      new Uint8Array(incomingFile.keyIV)
    );
    const aesKey = await importAESKey(rawAesKeyBuffer);

    if (!aesKey || !incomingFile.fileIV) {
      toast.error("Missing AES key or IV for decryption.");
      return;
    }

    const validChunks = receivedChunks.filter(c => c instanceof ArrayBuffer);
    const encryptedBlob = new Blob(validChunks);

    const decryptedBlob = await decryptFile(encryptedBlob, aesKey, incomingFile.fileIV);
    const fileVerified= await verifyFileHash(decryptedBlob, incomingFile.hash);
    
    if (!fileVerified) {
      toast.error("File integrity check failed. The file may be corrupted.");
      return;
    }

    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = incomingFile.name;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("✅ File decrypted and downloaded.");
  };

  const disconnectPeer = () => {
    sendChunk(JSON.stringify({ type: "disconnect" }));

    setConnected(false);
    setFriendId("");
    setReceivedChunks([]);
    setIncomingFile(null);
    setSelectedFile(null);
    setSendingProgress(0);
    setReceivingProgress(0);
    setIsSending(false);
    setIsReceiving(false);
    setPeerPublicKey(null);
    peerKeyReceivedRef.current = false;
    myKeySentRef.current = false;

    toast.info("Disconnected.");
  };

  if (!backendReady) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black to-gray-900 text-white z-50">
        {/* Logo & App name */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-red-500 text-4xl animate-pulse">⚡</span>
          <h1 className="text-3xl font-bold text-red-400 tracking-wider drop-shadow-lg">
            VoidShare
          </h1>
        </div>

        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>

        {/* Loading dots */}
        <p className="mt-8 text-gray-400 text-lg flex items-center">
          Loading
          <span className="animate-bounce">.</span>
          <span className="animate-bounce delay-150">.</span>
          <span className="animate-bounce delay-300">.</span>
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-8 font-mono">
      <div className="max-w-xl mx-auto space-y-10">
        <h1 className="text-5xl font-bold text-center mb-6 text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.9)] animate-pulse">
          ⚡ VoidShare
        </h1>
        <Link href="/devlogs">
          <button
            className="fixed top-6 right-6 px-4 py-2 text-sm bg-gray-800 border border-red-500 rounded-lg font-semibold 
               hover:bg-red-500 hover:border-red-400 hover:scale-105 transition-all cursor-pointer"
          >
            📜 View DevLogs
          </button>
        </Link>

        {/* Peer ID Card */}
        <div className="bg-zinc-900/70 backdrop-blur-md p-5 rounded-xl border border-zinc-700 shadow-[0_0_15px_rgba(0,0,0,0.4)]">
          <p className="text-xs text-zinc-400">Your Peer ID:</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-blue-400 text-sm break-all font-mono">{myId}</p>
            <button
              onClick={() => {
                setCopying(true);
                navigator.clipboard.writeText(myId);
                setTimeout(() => {
                  setCopying(false);
                }, 2000);
              }}
              disabled={copying}
              className="text-xs bg-gradient-to-r from-blue-700 to-blue-500 disabled:opacity-80 px-3 py-1 rounded hover:opacity-80 transition shadow-sm"
            >
              {copying ? "Copied..." : "Copy"}
            </button>
          </div>
        </div>

        {/* Connect Input */}
        <div className="flex gap-4 items-center">
          <input
            placeholder="Enter friend's Peer ID"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
          />
          <button
            onClick={handleConnect}
            className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            Connect
          </button>
        </div>

        {connected && (
          <div className="text-green-400 text-sm font-semibold ml-1">
            ✅ Connected to {friendId}
            <button
              onClick={disconnectPeer}
              className="mt-2 ml-5 bg-gradient-to-r from-zinc-700 to-zinc-600 text-white px-4 py-2 rounded hover:from-red-700 hover:to-red-600 transition cursor-pointer"
            >
              🔌 Disconnect
            </button>
          </div>
        )}

        {/* File Picker & Transfer Progress */}
        <div className="space-y-5">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedFile(file);
              }
            }}
            className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-gradient-to-r file:from-red-600 file:to-blue-700
        file:text-white hover:file:opacity-90 transition"
          />

          {selectedFile && connected && !isSending && (
            <button
              onClick={handleFileSend}
              disabled={encrypting}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:bg-gradient-to-r disabled:from-green-700 disabled:to-green-600 text-white px-4 py-2 rounded-lg shadow-md transition"
            >
              {encrypting ? "Encrypting...." : "📤 Send File"}
            </button>
          )}


          {/* Sending Progress */}
          {isSending && (
            <div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-500 via-orange-500 to-red-700 h-3 rounded-full transition-all"
                  style={{ width: `${sendingProgress}%` }}
                />
              </div>
              <p className="text-xs text-red-400 mt-1">
                Sending... {Math.floor(sendingProgress)}%
              </p>
            </div>
          )}

          {/* Receiving Progress */}
          {isReceiving && (
            <div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700 h-3 rounded-full transition-all"
                  style={{ width: `${receivingProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-300 mt-1">
                Receiving... {Math.floor(receivingProgress)}%
              </p>
            </div>
          )}

          {/* Download Button */}
          {receivedChunks.length > 0 && !isReceiving && (
            <button
              onClick={handleDownload}
              className="w-full bg-gradient-to-br from-blue-700 via-red-600 to-blue-900 px-4 py-2 rounded-lg hover:shadow-xl transition duration-300"
            >
              ⬇ Download Received File
            </button>
          )}
        </div>
        <div className="inline-flex flex-col items-center">
          <QrCode peerId={myId} />
        </div>
        <div>
          <p className="text-red-500 animate-pulse">
            Note: When connecting between a desktop and a mobile device, use the desktop to initiate the connection.
          </p>
        </div>
        <a
          href="https://github.com/Luv-valecha/VoidShare"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform cursor-pointer"
        >
          {/* GitHub SVG logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M12 0C5.37 0 0 5.37 0 12a12 12 0 008.21 11.44c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.48-1.34-5.48-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0024 12c0-6.63-5.37-12-12-12z"
              clipRule="evenodd"
            />
          </svg>

          <span>GitHub</span>
        </a>
      </div>

      <ToastContainer position="top-center" theme="dark" />
    </main>
  );
}
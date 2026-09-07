"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Header } from "@/components/Header";
import { PeerIdCard } from "@/components/PeerIdCard";
import { ConnectPanel } from "@/components/ConnectPanel";
import { FileTransferPanel } from "@/components/FileTransferPanel";
import { QrCode } from "@/components/QrCode";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useBackendWarmup } from "@/hooks/useBackendWarmup";
import { useVoidShare } from "@/hooks/useVoidShare";

export default function Home() {
  const backendReady = useBackendWarmup();
  const voidShare = useVoidShare();

  if (!backendReady) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen px-4 py-8 sm:py-12 font-sans">
      <div className="void-glow" />

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <Header />

        <PeerIdCard myId={voidShare.myId} />

        <ConnectPanel
          friendId={voidShare.friendId}
          setFriendId={voidShare.setFriendId}
          connected={voidShare.connected}
          channelOpen={voidShare.channelOpen}
          keysReady={voidShare.keysReady}
          onConnect={voidShare.handleConnect}
          onDisconnect={voidShare.disconnectPeer}
        />

        <FileTransferPanel
          connected={voidShare.connected}
          keysReady={voidShare.keysReady}
          selectedFile={voidShare.selectedFile}
          setSelectedFile={voidShare.setSelectedFile}
          encrypting={voidShare.encrypting}
          isSending={voidShare.isSending}
          isReceiving={voidShare.isReceiving}
          sendingProgress={voidShare.sendingProgress}
          receivingProgress={voidShare.receivingProgress}
          receivedChunks={voidShare.receivedChunks}
          onSend={voidShare.handleFileSend}
          onDownload={voidShare.handleDownload}
        />

        <div className="flex justify-center pt-2">
          <QrCode peerId={voidShare.myId} />
        </div>
        
      </div>

      <a
        href="https://github.com/Luv-valecha/VoidShare"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-10 hidden sm:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-lg shadow-md hover:border-zinc-600 hover:text-white transition text-xs font-medium"
      >
        Star on GitHub
      </a>

      <ToastContainer position="top-center" theme="dark" />
    </main>
  );
}

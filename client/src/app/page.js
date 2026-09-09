"use client";

import { Header } from "@/components/Header";
import { PeerIdCard } from "@/components/PeerIdCard";
import { ConnectPanel } from "@/components/ConnectPanel";
import { FileTransferPanel } from "@/components/FileTransferPanel";
import { QrCode } from "@/components/QrCode";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useVoidShareContext } from "@/context/VoidShareContext";

export default function Home() {
  const voidShare = useVoidShareContext();

  if (!voidShare.backendReady) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative min-h-screen px-4 py-8 sm:py-12 font-sans">
      <div className="void-glow" />

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <Header />

        <PeerIdCard myId={voidShare.myId} />

        <ConnectPanel
          myId={voidShare.myId}
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
        className="fixed bottom-5 right-5 z-10 hidden sm:flex items-center gap-2 bg-[var(--c-surface-2)]/80 border border-[var(--c-border-strong)] text-[var(--c-text-muted)] px-3 py-2 rounded-lg shadow-md hover:border-[var(--c-accent)]/60 hover:text-[var(--c-text)] transition text-xs font-medium"
      >
        Star on GitHub
      </a>
    </main>
  );
}

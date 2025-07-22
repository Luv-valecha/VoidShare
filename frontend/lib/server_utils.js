let localConnection;
let dataChannel;
let ws;
let pendingOffer;
let remotePeerId;
let pendingCandidates = [];

const peerId = Math.random().toString(36).substring(2, 10);

// to display own peerid in frontend
export const getPeerId = () => {
    return peerId;
}

export const connectserver = (onSignalMessage, onStatusUpdate) => {
    return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;

        ws = new WebSocket(process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || `${protocol}//${host}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "register", peerId }));
            console.log(`WebSocket connected for ${peerId}`);
            resolve(); // ✅ WebSocket is ready!
        };

        ws.onerror = (err) => {
            console.error("WebSocket connection error", err);
            reject(err);
        };

        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (msg.type === "signal") {
                onSignalMessage(msg.from, msg.data);
            }

            if (msg.type === "answer") {
                onStatusUpdate?.("accepted", msg.from);
                onSignalMessage(msg.from, msg.data);
            }

            if (msg.type === "decline") {
                onStatusUpdate?.("declined", msg.from);
            }

            if (msg.type === "error") {
                if (typeof window !== "undefined" && window.showConnectionError) {
                    window.showConnectionError(msg.message);
                }
            }
        };
    });
};

// to send the signal to socket server
export const sendSignal = (targetId, data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not ready — signal not sent.");
        return;
    }

    ws.send(JSON.stringify({
        type: "signal",
        target: targetId,
        data,
    }));
};

export const createConnection = async (targetId, onData, onReady) => {
    remotePeerId = targetId;
    localConnection = new RTCPeerConnection();

    // setting up data channel for file transfer
    dataChannel = localConnection.createDataChannel("file");
    dataChannel.binaryType = "arraybuffer";
    dataChannel.onopen = () => {
        console.log(`DataChannel open between ${peerId} and ${remotePeerId}`);
        onReady(true);
    };

    // on getting data through the channel
    dataChannel.onmessage = (e) => onData(e.data);

    // when we get ICE we send the signal to the socket server
    localConnection.onicecandidate = (e) => {
        if (e.candidate) {
            sendSignal(targetId, { candidate: e.candidate });
        }
    };

    // asking to connect
    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    sendSignal(targetId, { sdp: offer });
};

export const handleSignal = async (from, data, onData, onOfferReceived) => {
    if (!localConnection) {
        remotePeerId = from;
        localConnection = new RTCPeerConnection();

        // Receiving data channel
        localConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            dataChannel.binaryType = "arraybuffer";

            dataChannel.onmessage = (e) => onData(e.data);
        };


        // ICE gathering
        localConnection.onicecandidate = (e) => {
            if (e.candidate) {
                sendSignal(from, { candidate: e.candidate });
            }
        };
    }

    // Handling offer
    if (data.sdp && data.sdp.type === "offer") {
        pendingOffer = { from, sdp: data.sdp };
        onOfferReceived(from);
        return;
    }

    // Handling answer
    if (data.sdp && data.sdp.type === "answer") {
        await localConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

        for (const candidate of pendingCandidates) {
            await localConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates = [];
        return;
    }

    // Handling ICE candidate
    if (data.candidate) {
        if (localConnection.remoteDescription && localConnection.remoteDescription.type) {
            await localConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
            console.log("Queuing ICE candidate until remoteDescription is set.");
            pendingCandidates.push(data.candidate);
        }
    }
};


export const sendChunk = (chunk) => {
    if (dataChannel?.readyState === "open") {
        dataChannel.send(chunk);
    }
};

export const acceptOffer = async (from) => {
    if (!pendingOffer || pendingOffer.from !== from) return;

    const remoteDesc = new RTCSessionDescription(pendingOffer.sdp);
    await localConnection.setRemoteDescription(remoteDesc);

    const answer = await localConnection.createAnswer();
    await localConnection.setLocalDescription(answer);

    sendSignal(pendingOffer.from, {
        sdp: answer,
        type: "answer",
    });

    pendingOffer = null;
};

export const declineOffer = (from) => {
    sendSignal(pendingOffer.from, { type: "decline" },);
};

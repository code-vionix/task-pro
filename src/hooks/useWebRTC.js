import { useCallback, useEffect, useRef, useState } from 'react';

export const useWebRTC = (socket, sessionId) => {
    const pc = useRef(null);
    const [stream, setStream] = useState(null);
    // Buffer for ICE candidates that arrive before remote description is set
    const iceCandidateBuffer = useRef([]);
    const remoteDescSet = useRef(false);

    const createPeerConnection = useCallback(() => {
        if (pc.current) return pc.current;

        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { 
                    urls: 'turn:213.199.58.40:3478?transport=udp',
                    username: 'codevionix',
                    credential: 'mirror123' 
                },
                { 
                    urls: 'turn:213.199.58.40:3478?transport=tcp',
                    username: 'codevionix',
                    credential: 'mirror123'
                },
                { 
                    urls: 'turn:213.199.58.40:443?transport=tcp',
                    username: 'codevionix',
                    credential: 'mirror123'
                }
            ],
            iceCandidatePoolSize: 2,
            bundlePolicy: 'max-bundle',
            iceTransportPolicy: 'all',
            rtcpMuxPolicy: 'require'
        };

        const peer = new RTCPeerConnection(config);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Local ICE candidate generated:', event.candidate.candidate);
                socket.emit('webrtc:ice-candidate', {
                    sessionId,
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    target: 'device'
                });
            } else {
                console.log('[WebRTC] ICE Gathering Complete');
            }
        };

        peer.ontrack = (event) => {
            console.log('[WebRTC] Track received:', event.streams[0]);
            setStream(event.streams[0]);
        };

        peer.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE Connection State Changed:', peer.iceConnectionState);
            if (peer.iceConnectionState === 'failed' || peer.iceConnectionState === 'disconnected') {
                console.error('[WebRTC] ICE Connection failed/disconnected');
            }
        };

        peer.onconnectionstatechange = () => {
            console.log('[WebRTC] Peer Connection State Changed:', peer.connectionState);
        };

        pc.current = peer;
        // Reset buffering state for a new connection
        iceCandidateBuffer.current = [];
        remoteDescSet.current = false;
        return peer;
    }, [socket, sessionId]);

    const startWebRTC = useCallback(async () => {
        if (pc.current) return;
        
        console.log('[WebRTC] Starting WebRTC...');
        const peer = createPeerConnection();
        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        console.log('[WebRTC] Sending offer to phone...');
        socket.emit('webrtc:offer', {
            sessionId,
            sdp: offer.sdp,
            type: offer.type
        });
    }, [createPeerConnection, socket, sessionId]);

    const stopWebRTC = useCallback(() => {
        if (pc.current) {
            console.log('[WebRTC] Stopping WebRTC. Trace:', new Error().stack);
            pc.current.close();
            pc.current = null;
        }
        iceCandidateBuffer.current = [];
        remoteDescSet.current = false;
        setStream(null);
    }, []);

    useEffect(() => {
        if (!socket || !sessionId) return;

        const handleAnswer = async (data) => {
            console.log('[WebRTC] RECEIVED ANSWER FROM PHONE:', data);
            if (pc.current) {
                try {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(data));
                    remoteDescSet.current = true;
                    console.log('[WebRTC] SUCCESS: Remote description set');

                    // Flush any buffered ICE candidates that arrived early
                    console.log(`[WebRTC] Flushing ${iceCandidateBuffer.current.length} buffered ICE candidates`);
                    for (const candidate of iceCandidateBuffer.current) {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log('[WebRTC] Buffered ICE candidate added successfully');
                        } catch (e) {
                            console.warn('[WebRTC] Failed to add buffered ICE candidate:', e.message);
                        }
                    }
                    iceCandidateBuffer.current = [];
                } catch (e) {
                    console.error('[WebRTC] ERROR: Setting remote description failed:', e);
                }
            }
        };
 
        const handleIceCandidate = async (data) => {
            console.log('[WebRTC] RECEIVED ICE CANDIDATE FROM PHONE:', data);
            if (!pc.current) return;

            const candidate = {
                candidate: data.candidate,
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex
            };

            // If remote description not yet set, buffer the candidate
            if (!remoteDescSet.current) {
                console.log('[WebRTC] Remote desc not ready, buffering ICE candidate');
                iceCandidateBuffer.current.push(candidate);
                return;
            }

            try {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[WebRTC] SUCCESS: Remote ICE candidate added');
            } catch (e) {
                console.error('[WebRTC] ERROR: Adding received ice candidate failed:', e);
            }
        };
 
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);

        return () => {
            console.log('[WebRTC] Cleaning up socket listeners and stopping connection');
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice-candidate', handleIceCandidate);
            stopWebRTC();
        };
    }, [socket, sessionId, stopWebRTC]);

    return { startWebRTC, stopWebRTC, stream };
};

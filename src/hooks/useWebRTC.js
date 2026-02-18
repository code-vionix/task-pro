import { useCallback, useEffect, useRef, useState } from 'react';

export const useWebRTC = (socket, sessionId) => {
    const pc = useRef(null);
    const [stream, setStream] = useState(null);

    const createPeerConnection = useCallback(() => {
        if (pc.current) return pc.current;

        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { 
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject' 
                },
                { 
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                { 
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                { 
                    urls: 'turn:stun.is:3478?transport=udp',
                    username: 'stun',
                    credential: 'stun' 
                },
                { 
                    urls: 'turn:stun.is:3478?transport=tcp',
                    username: 'stun',
                    credential: 'stun'
                },
            ],
            iceCandidatePoolSize: 10,
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
        return peer;
    }, [socket, sessionId]);

    const startWebRTC = useCallback(async () => {
        if (pc.current) return;
        
        console.log('[WebRTC] Starting WebRTC...');
        const peer = createPeerConnection();
        peer.addTransceiver('video', { direction: 'recvonly' });

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
        setStream(null);
    }, []);

    useEffect(() => {
        if (!socket || !sessionId) return;

        const handleAnswer = async (data) => {
            console.log('[WebRTC] RECEIVED ANSWER FROM PHONE:', data);
            if (pc.current) {
                try {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(data));
                    console.log('[WebRTC] SUCCESS: Remote description set');
                } catch (e) {
                    console.error('[WebRTC] ERROR: Setting remote description failed:', e);
                }
            }
        };
 
        const handleIceCandidate = async (data) => {
            console.log('[WebRTC] RECEIVED ICE CANDIDATE FROM PHONE:', data);
            if (pc.current) {
                try {
                    await pc.current.addIceCandidate(new RTCIceCandidate({
                        candidate: data.candidate,
                        sdpMid: data.sdpMid,
                        sdpMLineIndex: data.sdpMLineIndex
                    }));
                    console.log('[WebRTC] SUCCESS: Remote ICE candidate added');
                } catch (e) {
                    console.error('[WebRTC] ERROR: Adding received ice candidate failed:', e);
                }
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

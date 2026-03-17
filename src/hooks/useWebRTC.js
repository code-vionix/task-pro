
import { useCallback, useEffect, useRef, useState } from 'react';

export const useWebRTC = (socket, sessionId) => {
    const pc = useRef(null);
    const [stream, setStream] = useState(null);
    const iceCandidateBuffer = useRef([]);
    const remoteDescSet = useRef(false);
    const isStarting = useRef(false);
    const isSettingRemoteDesc = useRef(false);

    // ─── STOP ────────────────────────────────────────────────────────────
    const stopWebRTC = useCallback(() => {
        if (pc.current) {

            pc.current.ontrack = null;
            pc.current.onicecandidate = null;
            pc.current.oniceconnectionstatechange = null;
            pc.current.onconnectionstatechange = null;
            pc.current.close();
            pc.current = null;
        }
        iceCandidateBuffer.current = [];
        remoteDescSet.current = false;
        isStarting.current = false;
        isSettingRemoteDesc.current = false;
        setStream(null);
    }, []);

    // ─── START ───────────────────────────────────────────────────────────
    const startWebRTC = useCallback(async () => {
        if (isStarting.current) {
            return;
        }

        // Always close any existing connection first so we get a fresh one.
        // This is the critical fix: if a previous session's PC is lingering
        // (e.g. from screen mirroring), it must be replaced with a fresh PC
        // configured for this new stream session.
        if (pc.current) {
            stopWebRTC();
        }

        try {
            isStarting.current = true;


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
                sdpSemantics: 'unified-plan',
                bundlePolicy: 'max-bundle'
            };

            const peer = new RTCPeerConnection(config);
            pc.current = peer;
            iceCandidateBuffer.current = [];
            remoteDescSet.current = false;

            // ── track handler ─────────────────────────────────────────
            peer.ontrack = (event) => {

                if (event.streams && event.streams[0]) {

                    setStream(event.streams[0]);
                } else {
                    // Fallback: build stream from individual track

                    const ms = new MediaStream([event.track]);
                    setStream(ms);
                }
            };

            // ── ICE candidate ─────────────────────────────────────────
            peer.onicecandidate = (event) => {
                if (event.candidate) {

                    socket.emit('webrtc:ice-candidate', {
                        sessionId,
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        target: 'device'
                    });
                } else {
                }
            };

            // ── state logging ─────────────────────────────────────────
            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === 'failed') {

                }
            };
            peer.onconnectionstatechange = () => {
            };

            // ── create offer ──────────────────────────────────────────
            peer.addTransceiver('video', { direction: 'recvonly' });
            peer.addTransceiver('audio', { direction: 'recvonly' });

            const offer = await peer.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            });
            await peer.setLocalDescription(offer);


            socket.emit('webrtc:offer', {
                sessionId,
                sdp: offer.sdp,
                type: offer.type
            });

        } catch (e) {

            stopWebRTC();
        } finally {
            isStarting.current = false;
        }
    }, [socket, sessionId, stopWebRTC]);

    // ─── HANDLE ANSWER ────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !sessionId) return;

        const handleAnswer = async (data) => {


            if (!pc.current) {

                return;
            }

            // If already stable, the connection is already good — skip
            if (pc.current.signalingState === 'stable') {

                return;
            }

            if (isSettingRemoteDesc.current) {

                return;
            }

            try {
                isSettingRemoteDesc.current = true;
                await pc.current.setRemoteDescription(
                    new RTCSessionDescription(data)
                );
                remoteDescSet.current = true;


                // Flush buffered ICE candidates
                const buffered = iceCandidateBuffer.current.splice(0);
                if (buffered.length > 0) {

                    for (const c of buffered) {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(c));
                        } catch (e) {

                        }
                    }
                }
            } catch (e) {

            } finally {
                isSettingRemoteDesc.current = false;
            }
        };

        const handleIceCandidate = async (data) => {
            if (!pc.current) return;

            const candidate = {
                candidate: data.candidate,
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex
            };

            if (!remoteDescSet.current) {

                iceCandidateBuffer.current.push(candidate);
                return;
            }

            try {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {

            }
        };

        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIceCandidate);

        return () => {
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice-candidate', handleIceCandidate);
        };
    }, [socket, sessionId]);

    return { startWebRTC, stopWebRTC, stream };
};

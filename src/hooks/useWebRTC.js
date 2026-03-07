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
            console.log('[WebRTC] Closing PeerConnection');
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
            console.log('[WebRTC] Already starting, skipping');
            return;
        }

        // Always close any existing connection first so we get a fresh one.
        // This is the critical fix: if a previous session's PC is lingering
        // (e.g. from screen mirroring), it must be replaced with a fresh PC
        // configured for this new stream session.
        if (pc.current) {
            console.log('[WebRTC] Closing old PeerConnection before starting new one');
            stopWebRTC();
        }

        try {
            isStarting.current = true;
            console.log('[WebRTC] Creating fresh PeerConnection...');

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
                console.log('[WebRTC] ontrack fired:', event.track.kind,
                    'streams:', event.streams.length);
                if (event.streams && event.streams[0]) {
                    console.log('[WebRTC] Setting stream from event.streams[0]');
                    setStream(event.streams[0]);
                } else {
                    // Fallback: build stream from individual track
                    console.warn('[WebRTC] No stream in event, building from track');
                    const ms = new MediaStream([event.track]);
                    setStream(ms);
                }
            };

            // ── ICE candidate ─────────────────────────────────────────
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[WebRTC] Sending ICE candidate to device');
                    socket.emit('webrtc:ice-candidate', {
                        sessionId,
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        target: 'device'
                    });
                } else {
                    console.log('[WebRTC] ICE gathering complete');
                }
            };

            // ── state logging ─────────────────────────────────────────
            peer.oniceconnectionstatechange = () => {
                console.log('[WebRTC] ICE state:', peer.iceConnectionState);
                if (peer.iceConnectionState === 'failed') {
                    console.error('[WebRTC] ICE failed — check TURN server');
                }
            };
            peer.onconnectionstatechange = () => {
                console.log('[WebRTC] Connection state:', peer.connectionState);
            };

            // ── create offer ──────────────────────────────────────────
            peer.addTransceiver('video', { direction: 'recvonly' });
            peer.addTransceiver('audio', { direction: 'recvonly' });

            const offer = await peer.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            });
            await peer.setLocalDescription(offer);

            console.log('[WebRTC] Sending offer to phone, sessionId:', sessionId);
            socket.emit('webrtc:offer', {
                sessionId,
                sdp: offer.sdp,
                type: offer.type
            });

        } catch (e) {
            console.error('[WebRTC] Error in startWebRTC:', e);
            stopWebRTC();
        } finally {
            isStarting.current = false;
        }
    }, [socket, sessionId, stopWebRTC]);

    // ─── HANDLE ANSWER ────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !sessionId) return;

        const handleAnswer = async (data) => {
            console.log('[WebRTC] Answer received. PC state:',
                pc.current?.signalingState);

            if (!pc.current) {
                console.warn('[WebRTC] No PeerConnection for answer');
                return;
            }

            // If already stable, the connection is already good — skip
            if (pc.current.signalingState === 'stable') {
                console.warn('[WebRTC] Answer received but already stable, ignoring');
                return;
            }

            if (isSettingRemoteDesc.current) {
                console.warn('[WebRTC] Already setting remote desc, skip duplicate');
                return;
            }

            try {
                isSettingRemoteDesc.current = true;
                await pc.current.setRemoteDescription(
                    new RTCSessionDescription(data)
                );
                remoteDescSet.current = true;
                console.log('[WebRTC] Remote description set ✅. State:',
                    pc.current.signalingState);

                // Flush buffered ICE candidates
                const buffered = iceCandidateBuffer.current.splice(0);
                if (buffered.length > 0) {
                    console.log('[WebRTC] Flushing', buffered.length, 'buffered candidates');
                    for (const c of buffered) {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(c));
                        } catch (e) {
                            console.warn('[WebRTC] Failed to add buffered candidate:', e.message);
                        }
                    }
                }
            } catch (e) {
                console.error('[WebRTC] setRemoteDescription failed:', e);
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
                console.log('[WebRTC] Buffering early ICE candidate');
                iceCandidateBuffer.current.push(candidate);
                return;
            }

            try {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[WebRTC] ICE candidate added ✅');
            } catch (e) {
                console.error('[WebRTC] addIceCandidate failed:', e);
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

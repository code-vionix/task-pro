
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function CallOverlay({ 
    isOpen, 
    onClose, 
    peer, 
    isVideo, 
    socket, 
    currentUser,
    isIncoming,
    onAccept
}) {
    const [status, setStatus] = useState(isIncoming ? 'Incoming Call...' : 'Calling...');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const pc = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { 
                urls: 'turn:213.199.58.40:3478?transport=udp',
                username: 'codevionix',
                credential: 'mirror123' 
            }
        ]
    };

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (pc.current) {
            pc.current.close();
        }
        setLocalStream(null);
        setRemoteStream(null);
    };

    const initWebRTC = async (stream) => {
        const peerConn = new RTCPeerConnection(config);
        pc.current = peerConn;

        stream.getTracks().forEach(track => {
            peerConn.addTrack(track, stream);
        });

        peerConn.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('call:signal', {
                    targetId: peer.id,
                    signal: { candidate: event.candidate }
                });
            }
        };

        peerConn.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        return peerConn;
    };

    const handleOffer = async (signal) => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo
        });
        setLocalStream(stream);
        const peerConn = await initWebRTC(stream);
        
        await peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConn.createAnswer();
        await peerConn.setLocalDescription(answer);
        
        socket.emit('call:signal', {
            targetId: peer.id,
            signal: { sdp: answer }
        });
    };

    const createOffer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });
            setLocalStream(stream);
            const peerConn = await initWebRTC(stream);
            
            const offer = await peerConn.createOffer();
            await peerConn.setLocalDescription(offer);
            
            socket.emit('call:signal', {
                targetId: peer.id,
                signal: { sdp: offer }
            });
        } catch (err) {
            console.error('Failed to get media', err);
            setStatus('Error accessing camera/mic');
        }
    };

    useEffect(() => {
        if (!isOpen) {
            cleanup();
            return;
        }

        socket.on('callAccepted', () => {
            setStatus('Connected');
            if (!isIncoming) {
                createOffer();
            }
        });

        socket.on('call:signal', async (data) => {
            if (data.signal.sdp) {
                if (data.signal.sdp.type === 'offer') {
                    if (pc.current) {
                         const offerDesc = new RTCSessionDescription(data.signal.sdp);
                         await pc.current.setRemoteDescription(offerDesc);
                         const answer = await pc.current.createAnswer();
                         await pc.current.setLocalDescription(answer);
                         
                         socket.emit('call:signal', {
                             targetId: peer.id,
                             signal: { sdp: answer }
                         });
                    }
                } else if (data.signal.sdp.type === 'answer') {
                    if (pc.current) {
                        const answerDesc = new RTCSessionDescription(data.signal.sdp);
                        await pc.current.setRemoteDescription(answerDesc);
                    }
                }
            } else if (data.signal.candidate) {
                if (pc.current) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
                }
            }
        });

        socket.on('callEnded', () => {
            cleanup();
            onClose();
        });

        socket.on('callRejected', () => {
            cleanup();
            onClose();
            alert('Call rejected');
        });

        return () => {
            socket.off('callAccepted');
            socket.off('call:signal');
            socket.off('callEnded');
            socket.off('callRejected');
            cleanup();
        };
    }, [isOpen]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleAccept = async () => {
        onAccept();
        setStatus('Connecting...');
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo
        });
        setLocalStream(stream);
        await initWebRTC(stream);
    };

    const handleReject = () => {
        socket.emit('rejectCall', { callerId: peer.id, receiverId: currentUser.id });
        onClose();
    };

    const handleEnd = () => {
        socket.emit('endCall', { targetId: peer.id });
        cleanup();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4">
            {/* Background Stream */}
            <div className="absolute inset-0 z-0">
                {remoteStream ? (
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/20 mb-6 bg-slate-800 flex items-center justify-center">
                            {peer.avatarUrl ? (
                                <img src={peer.avatarUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <span className="text-4xl font-black text-blue-500">{peer.email[0].toUpperCase()}</span>
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic italic-text">
                            {peer.email.split('@')[0]}
                        </h2>
                        <p className="text-slate-400 mt-2 font-medium tracking-widest uppercase text-sm">{status}</p>
                    </div>
                )}
            </div>

            {/* Local Video Overlay */}
            {localStream && isVideo && (
                <div className="absolute top-8 right-8 w-32 md:w-48 aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-10">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover mirror"
                    />
                </div>
            )}

            {/* Controls */}
            <div className="mt-auto mb-12 flex items-center gap-6 z-20">
                {isIncoming && status === 'Incoming Call...' ? (
                    <>
                        <button 
                            onClick={handleReject}
                            className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg hover:bg-rose-600 transition-colors"
                        >
                            <PhoneOff className="w-8 h-8" />
                        </button>
                        <button 
                            onClick={handleAccept}
                            className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 transition-colors animate-pulse"
                        >
                            {isVideo ? <Video className="w-10 h-10" /> : <Phone className="w-10 h-10" />}
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => {
                                setIsMuted(!isMuted);
                                localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
                            }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-rose-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </button>
                        
                        <button 
                            onClick={handleEnd}
                            className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg hover:bg-rose-600 transition-colors"
                        >
                            <PhoneOff className="w-10 h-10" />
                        </button>

                        {isVideo && (
                             <button 
                             onClick={() => {
                                 setIsCameraOff(!isCameraOff);
                                 localStream.getVideoTracks().forEach(t => t.enabled = isCameraOff);
                             }}
                             className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? 'bg-rose-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                         >
                             {isCameraOff ? <VideoOff /> : <Video />}
                         </button>
                        )}
                    </>
                )}
            </div>

            <style jsx>{`
                .mirror { transform: scaleX(-1); }
            `}</style>
        </div>
    );
}

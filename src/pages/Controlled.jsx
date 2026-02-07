import axios from 'axios';
import {
    AlertCircle,
    CheckCircle,
    Download,
    Monitor,
    Play,
    Power,
    QrCode,
    RefreshCw,
    Smartphone,
    Square,
    Trash2,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Controlled() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [screenFrame, setScreenFrame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/remote-control/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const connectToDevice = async (deviceId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const newSocket = io(`${API_URL}/remote-control`, {
        auth: { token },
      });

      setSocket(newSocket);

      newSocket.emit('session:start', { deviceId }, (response) => {
        if (response.success) {
          setSession(response.session);
          setSelectedDevice(deviceId);
        } else {
          alert('Failed to start session: ' + response.error);
        }
        setLoading(false);
      });

      newSocket.on('session:status', (data) => {
        if (data.accepted) {
          console.log('Session accepted!');
        } else {
          alert('Device rejected the connection');
          disconnectFromDevice();
        }
      });

      newSocket.on('screen:frame', (data) => {
        setScreenFrame(data.frame);
      });

      newSocket.on('command:completed', (data) => {
        console.log('Command completed:', data);
      });
    } catch (error) {
      console.error('Error connecting to device:', error);
      setLoading(false);
    }
  };

  const disconnectFromDevice = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setSession(null);
    setSelectedDevice(null);
    setScreenFrame(null);
  };

  const sendCommand = (type, payload = {}) => {
    if (!socket || !session) return;

    socket.emit(
      'command:send',
      {
        sessionId: session.id,
        type,
        payload,
      },
      (response) => {
        if (!response.success) {
          alert('Command failed: ' + response.error);
        }
      }
    );
  };

  const deleteDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to remove this device?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/remote-control/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const formatLastSeen = (date) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diff = Math.floor((now - lastSeen) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (session) {
    // Remote Control View
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Controlling Device
              </h2>
              <button
                onClick={disconnectFromDevice}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Power className="w-5 h-5" />
                Disconnect
              </button>
            </div>

            {/* Screen Display */}
            <div className="bg-black rounded-xl overflow-hidden mb-6 aspect-[9/16] max-w-md mx-auto">
              {screenFrame ? (
                <img
                  src={`data:image/jpeg;base64,${screenFrame}`}
                  alt="Device Screen"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4" />
                    <p>Waiting for screen share...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => sendCommand('SCREEN_SHARE_START')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Screen
              </button>
              <button
                onClick={() => sendCommand('SCREEN_SHARE_STOP')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop Screen
              </button>
              <button
                onClick={() => sendCommand('GET_NOTIFICATIONS')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Get Notifications
              </button>
              <button
                onClick={() => sendCommand('CUSTOM', { action: 'vibrate' })}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Vibrate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Device Control
            </h1>
            <p className="text-purple-300">
              Control your mobile devices from anywhere
            </p>
          </div>
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {devices.length === 0 ? (
          /* No Devices - Show Download Instructions */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Get Started with Remote Control
              </h2>
              <p className="text-purple-200 text-lg mb-8">
                Download our mobile app and control your device from this dashboard
              </p>

              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Download App</h3>
                  <p className="text-purple-300 text-sm">
                    Install the mobile app on your Android or iOS device
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Login</h3>
                  <p className="text-purple-300 text-sm">
                    Use your same account credentials to login
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Control</h3>
                  <p className="text-purple-300 text-sm">
                    Your device will appear here and you can control it
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/50"
              >
                <Download className="w-6 h-6" />
                Download Mobile App
              </button>

              {/* Info Box */}
              <div className="mt-8 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-blue-200 text-sm">
                      <strong>Important:</strong> Make sure to login with the same email and password you use on this website.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Device List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {device.deviceName}
                      </h3>
                      <p className="text-sm text-purple-300">
                        {device.deviceModel || 'Unknown Model'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDevice(device.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    {device.status === 'ONLINE' ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Offline</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-purple-300">
                    Last seen: {formatLastSeen(device.lastSeen)}
                  </p>
                  {device.osVersion && (
                    <p className="text-sm text-purple-300">
                      OS: {device.osVersion}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => connectToDevice(device.id)}
                  disabled={device.status !== 'ONLINE' || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Monitor className="w-5 h-5" />
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            ))}

            {/* Add Device Card */}
            <div
              onClick={() => setShowDownloadModal(true)}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 border-dashed border-purple-400/50 hover:border-purple-400 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
            >
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Add New Device
              </h3>
              <p className="text-purple-300 text-sm text-center">
                Download app and login to add more devices
              </p>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-purple-400/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Download App</h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Android Download */}
                <a
                  href="#"
                  className="block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">Android</h4>
                      <p className="text-green-200 text-sm">Download APK</p>
                    </div>
                    <Download className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* iOS Download */}
                <a
                  href="#"
                  className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🍎</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">iOS</h4>
                      <p className="text-blue-200 text-sm">Download from App Store</p>
                    </div>
                    <Download className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* QR Code Option */}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 text-sm">
                    Scan QR code to download
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-purple-200 text-sm">
                        After installing, login with your current credentials:
                      </p>
                      <p className="text-purple-300 text-sm mt-2 font-mono bg-black/30 px-2 py-1 rounded">
                        {JSON.parse(localStorage.getItem('user') || '{}').email || 'your-email@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

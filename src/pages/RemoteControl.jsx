import axios from 'axios';
import {
    Monitor,
    Play,
    PowerOff,
    RefreshCw,
    Smartphone,
    Square,
    Trash2,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RemoteControl() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [screenFrame, setScreenFrame] = useState(null);
  const [loading, setLoading] = useState(false);

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
      // Connect to WebSocket
      const token = localStorage.getItem('token');
      const newSocket = io(`${API_URL}/remote-control`, {
        auth: { token },
      });

      setSocket(newSocket);

      // Request session
      newSocket.emit('session:start', { deviceId }, (response) => {
        if (response.success) {
          setSession(response.session);
          setSelectedDevice(deviceId);
        } else {
          alert('Failed to start session: ' + response.error);
        }
        setLoading(false);
      });

      // Listen for session status
      newSocket.on('session:status', (data) => {
        if (data.accepted) {
          console.log('Session accepted!');
        } else {
          alert('Device rejected the connection');
          disconnectFromDevice();
        }
      });

      // Listen for screen frames
      newSocket.on('screen:frame', (data) => {
        setScreenFrame(data.frame);
      });

      // Listen for command completion
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
    const diff = Math.floor((now - lastSeen) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Remote Control
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

        {!session ? (
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
                        <span className="text-green-400">Online</span>
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

            {devices.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Smartphone className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Devices Found
                </h3>
                <p className="text-purple-300">
                  Install the mobile app and login to register your device
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Remote Control View */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Controlling Device
              </h2>
              <button
                onClick={disconnectFromDevice}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <PowerOff className="w-5 h-5" />
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
                Start Screen Share
              </button>
              <button
                onClick={() => sendCommand('SCREEN_SHARE_STOP')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop Screen Share
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
        )}
      </div>
    </div>
  );
}

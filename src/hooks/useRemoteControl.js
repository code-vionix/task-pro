import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
    addPendingCommand,
    removePendingCommand,
    resetSession,
    setCameraFrame,
    setCapturedPhoto,
    setConnectingDeviceId,
    setCurrentPath,
    setDevices,
    setFiles,
    setLoading,
    setNotifications,
    setScreenFrame,
    setSelectedDeviceId,
    setSession,
    setShowFileExplorer,
    setShowNotificationsModal,
    setSystemStats
} from '../store/slices/remoteControlSlice';

const API_URL = import.meta.env.VITE_API_URL || 'https://taskprobackend.codevionix.com';

export const useRemoteControl = () => {
  const dispatch = useDispatch();
  const { 
    session, 
    cameraFrame, 
    currentCameraFacing, 
    isAutoSync 
  } = useSelector((state) => state.remoteControl);

  const [socket, setSocket] = useState(null);
  const [lastCommandStatus, setLastCommandStatus] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/remote-control/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(setDevices(response.data));
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  }, [dispatch]);

  const sendCommand = useCallback((type, payload = {}) => {
    if (!socket || !session) return;
    dispatch(addPendingCommand({ type }));
    socket.emit('command:send', { sessionId: session.id, type, payload }, (response) => {
      dispatch(removePendingCommand({ type }));
      if (!response.success) alert('Command failed: ' + response.error);
    });
  }, [socket, session, dispatch]);

  const disconnectFromDevice = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    dispatch(resetSession());
  }, [socket, dispatch]);

  const connectToDevice = useCallback(async (deviceId) => {
    dispatch(setLoading(true));
    dispatch(setScreenFrame(null));
    dispatch(setCameraFrame(null));
    try {
      const token = localStorage.getItem('access_token');
      const newSocket = io(`${API_URL}/remote-control`, { auth: { token } });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        dispatch(setConnectingDeviceId(deviceId));
        newSocket.emit('session:start', { deviceId }, (response) => {
          if (response.success) {
            dispatch(setSession(response.session));
            dispatch(setSelectedDeviceId(deviceId));
            newSocket.emit('command:send', { sessionId: response.session.id, type: 'GET_STATS', payload: {} });
          } else {
            alert('Failed to start session: ' + response.error);
          }
          dispatch(setLoading(false));
          dispatch(setConnectingDeviceId(null));
        });
      });

      newSocket.on('connect_error', () => dispatch(setLoading(false)));
      
      newSocket.on('session:status', (data) => {
        if (!data.accepted) {
          alert('Device rejected the connection');
          disconnectFromDevice();
        }
      });

      newSocket.on('screen:frame', (data) => {
        if (data.type === 'camera') dispatch(setCameraFrame(data.frame));
        else dispatch(setScreenFrame(data.frame));
      });

      newSocket.on('command:completed', (data) => {
        setLastCommandStatus(data);
        dispatch(removePendingCommand({ type: data.type }));
        
        switch(data.type) {
          case 'GET_NOTIFICATIONS':
            if (data.result) {
              dispatch(setNotifications(data.result));
              dispatch(setShowNotificationsModal(true));
            }
            break;
          case 'GET_GALLERY':
            if (data.result) {
              dispatch(setFiles(data.result));
              dispatch(setCurrentPath('Image Gallery'));
              dispatch(setShowFileExplorer(true));
            }
            break;
          case 'VIEW_FILE':
            if (data.result) dispatch(setCapturedPhoto(`data:image/jpeg;base64,${data.result}`));
            break;
          case 'GET_STATS':
            if (data.result) dispatch(setSystemStats(data.result));
            break;
          case 'GET_FILES':
            if (data.result) {
              dispatch(setFiles(data.result));
              dispatch(setShowFileExplorer(true));
            }
            break;
          case 'CAMERA_CAPTURE':
            if (data.result) dispatch(setCapturedPhoto(`data:image/jpeg;base64,${data.result}`));
            break;
          case 'AUDIO_RECORD':
            if (data.result) {
              new Audio(`data:audio/mp4;base64,${data.result}`).play();
              alert('Audio recording received!');
            }
            break;
          default: break;
        }
      });
    } catch (error) {
      dispatch(setLoading(false));
    }
  }, [dispatch, disconnectFromDevice]);

  useEffect(() => {
    if (socket && session) {
      const interval = setInterval(() => {
        sendCommand('GET_STATS');
        if (cameraFrame && isAutoSync) {
          sendCommand('CAMERA_STREAM_START', { facing: currentCameraFacing });
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [socket, session, cameraFrame, isAutoSync, currentCameraFacing, sendCommand]);

  return { socket, lastCommandStatus, fetchDevices, connectToDevice, disconnectFromDevice, sendCommand };
};

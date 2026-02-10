import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  devices: [],
  selectedDeviceId: null,
  session: null,
  screenFrame: null,
  cameraFrame: null,
  loading: false,
  notifications: [],
  systemStats: { battery: 0, storageUsed: 0, storageAvailable: 0 },
  files: [],
  currentPath: null,
  capturedPhoto: null,
  pendingCommands: {}, // Map of type -> boolean
  currentCameraFacing: 0, // 0: back, 1: front
  isAutoSync: false,
  connectingDeviceId: null,
  showFileExplorer: false,
  showNotificationsModal: false,
};

const remoteControlSlice = createSlice({
  name: 'remoteControl',
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.devices = action.payload;
    },
    setSelectedDeviceId: (state, action) => {
      state.selectedDeviceId = action.payload;
    },
    setSession: (state, action) => {
      state.session = action.payload;
    },
    setScreenFrame: (state, action) => {
      state.screenFrame = action.payload;
    },
    setCameraFrame: (state, action) => {
      state.cameraFrame = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setConnectingDeviceId: (state, action) => {
      state.connectingDeviceId = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setSystemStats: (state, action) => {
      state.systemStats = { ...state.systemStats, ...action.payload };
    },
    setFiles: (state, action) => {
      state.files = action.payload;
    },
    setCurrentPath: (state, action) => {
      state.currentPath = action.payload;
    },
    setCapturedPhoto: (state, action) => {
      state.capturedPhoto = action.payload;
    },
    setIsAutoSync: (state, action) => {
      state.isAutoSync = action.payload;
    },
    setCurrentCameraFacing: (state, action) => {
      state.currentCameraFacing = action.payload;
    },
    setShowFileExplorer: (state, action) => {
      state.showFileExplorer = action.payload;
    },
    setShowNotificationsModal: (state, action) => {
      state.showNotificationsModal = action.payload;
    },
    addPendingCommand: (state, action) => {
      const { type } = action.payload;
      state.pendingCommands[type] = true;
    },
    removePendingCommand: (state, action) => {
      const { type } = action.payload;
      delete state.pendingCommands[type];
    },
    resetSession: (state) => {
      state.session = null;
      state.selectedDeviceId = null;
      state.screenFrame = null;
      state.cameraFrame = null;
      state.pendingCommands = {};
      state.showFileExplorer = false;
      state.showNotificationsModal = false;
    }
  },
});

export const {
  setDevices,
  setSelectedDeviceId,
  setSession,
  setScreenFrame,
  setCameraFrame,
  setLoading,
  setConnectingDeviceId,
  setNotifications,
  setSystemStats,
  setFiles,
  setCurrentPath,
  setCapturedPhoto,
  setIsAutoSync,
  setCurrentCameraFacing,
  setShowFileExplorer,
  setShowNotificationsModal,
  addPendingCommand,
  removePendingCommand,
  resetSession
} = remoteControlSlice.actions;

export default remoteControlSlice.reducer;

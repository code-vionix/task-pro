# Remote Control System - Complete Setup Guide

## 🎯 Overview

This is a **complete remote device control system** similar to AirDroid, allowing you to control your mobile device from a web browser.

### Features:
- ✅ **Device Registration** - Register mobile devices with your account
- ✅ **Real-time Connection** - WebSocket-based instant communication
- ✅ **Screen Sharing** - View mobile screen in real-time (WebRTC)
- ✅ **Remote Commands** - Control device remotely
- ✅ **Session Management** - Secure connection approval system
- ✅ **Activity Logs** - Track all remote activities

---

## 📦 Project Structure

```
project-name/
├── src/                          # Backend (NestJS)
│   ├── remote-control/          # Remote control module
│   │   ├── remote-control.gateway.ts    # WebSocket gateway
│   │   ├── remote-control.service.ts    # Business logic
│   │   ├── remote-control.controller.ts # REST API
│   │   └── remote-control.module.ts     # Module definition
│   └── ...
├── client/                       # Web Frontend (React)
│   └── src/
│       └── pages/
│           └── RemoteControl.jsx # Remote control dashboard
├── RemoteControlApp/            # Mobile App (React Native)
│   ├── App.tsx                  # Main app component
│   └── ...
└── prisma/
    └── schema.prisma            # Database schema
```

---

## 🗄️ Database Schema

The system uses the following models:

### RegisteredDevice
- Stores device information
- Tracks online/offline status
- Links to user account

### RemoteSession
- Manages active remote control sessions
- Stores WebRTC connection details
- Tracks session history

### RemoteCommand
- Logs all commands sent to device
- Tracks command execution status
- Stores results and errors

---

## 🚀 Setup Instructions

### 1. Backend Setup (Already Done ✅)

The backend is already configured with:
- Database migration completed
- WebSocket gateway configured
- REST API endpoints ready

### 2. Web Frontend Setup

Add the Remote Control page to your navigation:

**Edit `client/src/App.jsx`:**

```jsx
import RemoteControl from './pages/RemoteControl';

// Add to your routes:
<Route path="/remote-control" element={<RemoteControl />} />
```

**Add to navigation menu:**
```jsx
<Link to="/remote-control">
  <Smartphone className="w-5 h-5" />
  Remote Control
</Link>
```

### 3. Mobile App Setup

#### Step 1: Install Dependencies

```bash
cd RemoteControlApp
npm install
```

#### Step 2: Configure Server URL

Edit `RemoteControlApp/App.tsx` and change:

```typescript
const API_URL = 'http://YOUR_SERVER_IP:5000';
```

Replace `YOUR_SERVER_IP` with your actual server IP address.

**Finding your IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` (look for inet)

#### Step 3: Run on Android

```bash
# Make sure Android Studio is installed and emulator is running
npx react-native run-android
```

#### Step 4: Run on iOS (Mac only)

```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

---

## 📱 How to Use

### Mobile App:

1. **Login** with your existing account credentials
2. App will automatically **register your device**
3. Keep the app **running in background**
4. You'll see **connection status** on screen

### Web Dashboard:

1. Go to `/remote-control` page
2. You'll see all your **registered devices**
3. Click **"Connect"** on any online device
4. Mobile app will show **permission request**
5. Accept on mobile to start session
6. Use **control buttons** to:
   - Start/Stop screen sharing
   - Get notifications
   - Send custom commands

---

## 🔧 API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/remote-control/devices` | Get user's devices |
| GET | `/remote-control/devices/:id` | Get device details |
| DELETE | `/remote-control/devices/:id` | Remove device |
| GET | `/remote-control/sessions/:id` | Get session details |
| POST | `/remote-control/sessions/:id/end` | End session |
| GET | `/remote-control/sessions/:id/commands` | Get session commands |

### WebSocket Events

#### Client → Server:
- `device:register` - Register mobile device
- `session:start` - Request remote session
- `session:response` - Accept/reject session
- `command:send` - Send command to device
- `command:result` - Command execution result
- `webrtc:offer/answer/ice-candidate` - WebRTC signaling

#### Server → Client:
- `session:request` - Session request notification
- `session:status` - Session status update
- `command:execute` - Execute command
- `command:completed` - Command completion
- `screen:frame` - Screen frame data

---

## 🎨 Customization

### Adding New Commands

**1. Add to Prisma schema:**
```prisma
enum CommandType {
  // ... existing
  YOUR_NEW_COMMAND
}
```

**2. Handle in mobile app (`App.tsx`):**
```typescript
case 'YOUR_NEW_COMMAND':
  // Your implementation
  socket.emit('command:result', {
    commandId,
    status: 'COMPLETED',
    result: { /* your result */ },
  });
  break;
```

**3. Add button in web dashboard (`RemoteControl.jsx`):**
```jsx
<button onClick={() => sendCommand('YOUR_NEW_COMMAND', { /* payload */ })}>
  Your Command
</button>
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure API access
- ✅ **Session Approval** - User must approve each connection
- ✅ **Device Verification** - Unique device IDs
- ✅ **Command Logging** - All actions are logged
- ✅ **Auto Disconnect** - Sessions end on device disconnect

---

## 🐛 Troubleshooting

### Mobile app can't connect:
1. Check if server is running
2. Verify API_URL is correct
3. Make sure mobile and server are on same network
4. Check firewall settings

### Screen sharing not working:
- WebRTC requires HTTPS in production
- Use ngrok or similar for testing
- Check browser permissions

### Device shows offline:
- App must be running and logged in
- Check internet connection
- Restart the app

---

## 📈 Future Enhancements

Possible additions:
- 📸 **Screenshot capture**
- 📁 **File transfer**
- 📞 **Call management**
- 💬 **SMS access**
- 🔔 **Notification mirroring**
- 🎮 **Touch event simulation**
- 📹 **Video recording**

---

## 🎓 Learning Resources

- [React Native Docs](https://reactnative.dev/)
- [Socket.io Docs](https://socket.io/docs/)
- [WebRTC Guide](https://webrtc.org/getting-started/overview)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)

---

## 📝 Notes

- This is a **premium feature** - you can add payment integration
- For production, use **HTTPS** and **WSS** (secure WebSocket)
- Consider adding **rate limiting** to prevent abuse
- Implement **device limits** per user

---

## 🤝 Support

If you encounter any issues:
1. Check the activity logs in mobile app
2. Check browser console for errors
3. Verify database migrations ran successfully
4. Ensure all dependencies are installed

---

**Built with ❤️ using NestJS, React, and React Native**

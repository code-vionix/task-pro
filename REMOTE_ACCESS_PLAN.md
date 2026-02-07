# Project Plan: Vionix Link (AirDroid-like Service)

## 1. Overview
A standalone service allowing users to manage their mobile devices remotely from a web browser.
**Goal**: File access, storage monitoring, and basic device status (battery/network) via Web Interface.

## 2. Architecture

### A. The "Agent" (Mobile App)
*Note: This requires a React Native or Native Android project. I can generate the code, but you must compile it.*
-   **Role**: Installed on the phone. Acts as the "Server" or "Publisher".
-   **Tech**: React Native + WebRTC + Socket.io Client.
-   **Capabilities**:
    -   Read File System.
    -   Get Battery/System Status.
    -   Receive commands from Web.

### B. The "Controller" (Web Dashboard)
-   **Role**: The website used on PC/Laptop.
-   **Tech**: React (Existing Client or New Client).
-   **Features**:
    -   QR Code pairing.
    -   File Explorer UI.
    -   Device Dashboard.

### C. The "Signal Tower" (Backend Server)
-   **Role**: Connects the Mobile App to the Website securely.
-   **Tech**: NestJS (Existing Backend) + Socket.io.
-   **Mechanism**:
    1.  Web generates a QR code with a unique `SessionID`.
    2.  Mobile scans QR code and connects to Socket room `SessionID`.
    3.  P2P Connection (WebRTC) is established for heavy data (files).
    4.  Commands are sent via Socket/WebRTC.

## 3. Implementation Roadmap

### Phase 1: Infrastructure & Pairing
- [ ] Create `DeviceGateway` in NestJS (Socket.io).
- [ ] Create `Link` page in Web Client (Dashboard).
- [ ] Generate React Native Setup Guide.

### Phase 2: Basic Status
- [ ] Send Battery Level & Storage Info from "Mock" Mobile Client to Web.
- [ ] Display real-time status on Web.

### Phase 3: File System (Core Feature)
- [ ] Implement File Browsing Interface on Web.
- [ ] Define JSON structure for directory listing.

## 4. Security Note
This system relies on the user **explicitly launching the app** and **scanning a QR code**. It is not a background spyware tool. It behaves exactly like AirDroid or web.whatsapp.com.

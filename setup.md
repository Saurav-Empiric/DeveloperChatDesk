# Quick Setup Guide

## 1. Start WAHA (WhatsApp HTTP API)

```bash
# Start WAHA Docker container
docker run -it -p 3000:3000/tcp devlikeapro/waha
```

## 2. Connect WhatsApp Account

1. Open http://localhost:3000 in your browser
2. Click "Create Session" 
3. Enter session name (e.g., "admin" or "default")
4. Click "Start Session"
5. Scan QR code with your WhatsApp
6. Wait for status to become "WORKING"

## 3. Configure Environment

Create `.env.local` file:

```env
WAHA_API_URL=http://localhost:3000/
WAHA_API_KEY=
MONGODB_URI=mongodb://localhost:27017/client-developer-manage
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3001
```

## 4. Start Application

```bash
npm install
npm run dev
```

## 5. Access Admin Dashboard

1. Open http://localhost:3001
2. Login as admin
3. Check WAHA status (should show "Connected")
4. View connected WhatsApp accounts
5. Click "View Chats" to access WhatsApp conversations

## Features Available

✅ **Session Management**: View all connected WhatsApp accounts
✅ **Chat Interface**: WhatsApp-like UI for conversations  
✅ **Multi-Account**: Support for multiple WhatsApp numbers
✅ **Real-time**: Live message sending and receiving
✅ **Search**: Search through conversations
✅ **Assignment**: Assign chats to developers

## Workflow

1. **Admin connects WhatsApp** → WAHA Dashboard
2. **Admin manages chats** → This Application  
3. **Admin assigns chats** → To developers
4. **Developers respond** → Through assigned chats

## Troubleshooting

**WAHA not connecting?**
- Check Docker is running
- Verify port 3000 is free
- Check WAHA container logs

**No sessions showing?**
- Ensure WhatsApp is connected in WAHA dashboard
- Check session status is "WORKING" 
- Refresh admin dashboard

**Can't send messages?**
- Verify session is active
- Check WAHA API connection
- Ensure chat is selected 
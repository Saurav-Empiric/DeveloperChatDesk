# Client Developer Management System with WhatsApp Integration

A Next.js application for managing WhatsApp conversations between clients and developers using WAHA (WhatsApp HTTP API).

## Features

- **Admin Dashboard**: Manage WhatsApp sessions, view connected accounts, and oversee conversations
- **WhatsApp Integration**: Connect multiple WhatsApp accounts via WAHA self-hosted Docker
- **Chat Management**: WhatsApp-like UI for viewing and managing conversations
- **Developer Assignment**: Assign chats to specific developers
- **Session Management**: View and manage connected WhatsApp sessions
- **Real-time Updates**: Live chat interface with message sending capabilities

## Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Docker (for WAHA)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd client-devloper-manage
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# WAHA API Configuration
WAHA_API_URL=http://localhost:3000/
WAHA_API_KEY=

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/client-developer-manage

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3001

# Debug (optional)
DEBUG_API=false
```

### 3. Start WAHA Docker Container

WAHA (WhatsApp HTTP API) is required for WhatsApp integration:

```bash
docker run -it -p 3000:3000/tcp devlikeapro/waha
```

This will start WAHA on `http://localhost:3000` with a web dashboard.

### 4. Connect WhatsApp Account

1. Open WAHA dashboard at `http://localhost:3000`
2. Create a new session (e.g., "default" or "admin")
3. Start the session and scan the QR code with your WhatsApp
4. Wait for the session status to become "WORKING" or "CONNECTED"

### 5. Start the Application

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to access the application.

## Usage Workflow

### For Admins:

1. **Check WAHA Status**: Ensure WAHA service is running
2. **View Connected Accounts**: See all connected WhatsApp sessions
3. **Access Chats**: Navigate to the chats page to view conversations
4. **Select Account**: Choose from multiple connected WhatsApp accounts
5. **Manage Conversations**: View, search, and respond to messages
6. **Assign Developers**: Assign specific chats to developers

### WhatsApp Connection Process:

1. Start WAHA Docker container
2. Connect WhatsApp account in WAHA dashboard (http://localhost:3000)
3. Return to admin dashboard and click "Sync Sessions" to import connected accounts
4. Access chats through the admin panel

### Session Synchronization:

The platform now supports automatic synchronization of WhatsApp sessions created directly in WAHA:

1. **Manual Sync**: Click "Sync Sessions" button in admin dashboard to import all connected WhatsApp accounts from WAHA
2. **Auto Sync**: Sessions are automatically synced when admin dashboard loads
3. **Webhook Support**: Configure WAHA webhooks to automatically sync sessions in real-time

#### Configuring WAHA Webhooks (Optional):

To enable real-time session synchronization, configure WAHA to send webhooks to your application:

```bash
# When starting WAHA, set the webhook URL
docker run -it -p 3000:3000/tcp \
  -e WHATSAPP_HOOK_URL=http://your-app-url/api/webhooks/waha \
  -e WHATSAPP_HOOK_EVENTS=session.status,session.authenticated,session.disconnected,message \
  devlikeapro/waha
```

Or configure webhooks in WAHA dashboard after starting:
1. Go to WAHA dashboard (http://localhost:3000)
2. Navigate to Settings → Webhooks
3. Add webhook URL: `http://your-app-url/api/webhooks/waha`
4. Enable events: `session.status`, `session.authenticated`, `session.disconnected`, `message`

## Key Features

### WhatsApp-like Chat Interface

- **Chat List**: Sidebar with all conversations, search functionality
- **Message View**: WhatsApp-style message bubbles with timestamps
- **Real-time**: Live message sending and receiving
- **Multi-Account**: Support for multiple WhatsApp accounts

### Session Management

- **Auto-Detection**: Automatically detects connected WAHA sessions
- **Status Monitoring**: Real-time status of WhatsApp connections
- **Account Switching**: Easy switching between multiple accounts

### Developer Management

- **Chat Assignment**: Assign specific chats to developers
- **Access Control**: Role-based access (admin/developer)
- **Conversation Tracking**: Track which developer handles which chat

## API Endpoints

- `GET /api/whatsapp/sessions` - Get all connected WhatsApp sessions
- `POST /api/whatsapp/sync-sessions` - Sync sessions from WAHA to MongoDB
- `GET /api/whatsapp/chats` - Get chats for a specific session
- `GET /api/whatsapp/messages` - Get messages for a specific chat
- `POST /api/whatsapp/messages` - Send a message
- `GET /api/system/waha-status` - Check WAHA service status
- `POST /api/webhooks/waha` - Webhook endpoint for WAHA events
- `POST /api/webhooks/waha/session-events` - Webhook endpoint for session-specific events

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **WhatsApp API**: WAHA (WhatsApp HTTP API)

## Troubleshooting

### WAHA Connection Issues

1. Ensure Docker is running
2. Check if port 3000 is available
3. Verify WAHA container is running: `docker ps`
4. Check WAHA logs: `docker logs <container-id>`

### WhatsApp Session Issues

1. Ensure WhatsApp account is properly connected in WAHA dashboard
2. Check session status in WAHA dashboard
3. Restart session if needed
4. Re-scan QR code if session expired

### Application Issues

1. Check environment variables in `.env.local`
2. Ensure MongoDB is running
3. Verify WAHA_API_URL points to correct WAHA instance
4. Check browser console for errors

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

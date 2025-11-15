# Python Backend Setup and Integration

The ReachInbox application now uses a Python/FastAPI backend for advanced features like IMAP synchronization, AI-powered email categorization, and reply generation. The Node.js server proxies API requests to this Python backend.

## Quick Start

### Prerequisites
- Python 3.9 or higher
- pip or conda
- MongoDB connection string (provided)
- Google API key for Gemini (provided)

### Step 1: Set Up Python Backend

1. Navigate to the `python-backend` directory:
```bash
cd python-backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. The `.env` file is already configured with:
   - MongoDB connection string
   - Gemini API key
   - Database name

### Step 2: Start the Python Backend

From the `python-backend` directory:

```bash
python main.py
```

The backend will start on `http://localhost:8000`

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 3: Run the Full Application

In a **separate terminal**, run the Node.js development server (already running via the platform):

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Architecture

```
┌─────────────────────────────────┐
│   React Frontend (Client)        │
│   http://localhost:8080          │
└──────────────┬──────────────────┘
               │ API Calls to /api/*
               ▼
┌──────────────────────────────────┐
│   Node.js/Express Server         │
│   (Proxy Layer)                  │
│   http://localhost:5173          │
└──────────────┬──────────────────┘
               │ Forward to PYTHON_BACKEND_URL
               ▼
┌──────────────────────────────────┐
│   Python/FastAPI Backend         │
│   http://localhost:8000          │
├──────────────────────────────────┤
│ • IMAP Email Sync                │
│ • AI Categorization (Gemini)     │
│ • Reply Generation               │
│ • MongoDB Storage                │
└──────────────────────────────────┘
```

## API Endpoints (Handled by Python Backend)

### Account Management
- `POST /api/accounts/add` - Add IMAP account and start syncing
- `GET /api/accounts/list` - List all configured accounts

### Email Management
- `GET /api/emails` - Get emails (with optional filters)
- `GET /api/emails/{email_id}` - Get specific email
- `POST /api/emails/{email_id}/suggest-reply` - Generate AI reply
- `POST /api/emails/generate-reply` - Generate reply variants

### Knowledge Base
- `POST /api/knowledge/add` - Add product knowledge
- `GET /api/knowledge/list` - List knowledge items

### Statistics
- `GET /api/stats` - Get email statistics

## Features Enabled

### ✅ IMAP Synchronization
- Automatically syncs emails from configured IMAP accounts
- Fetches last 30 days of emails on first sync
- Stores emails in MongoDB

### ✅ AI-Powered Categorization
- Uses Google Gemini to categorize emails into:
  - Interested
  - Meeting Booked
  - Not Interested
  - Spam
  - Out of Office

### ✅ AI Reply Generation
- Generates three variants of replies: short, medium, detailed
- Based on incoming email content and user preferences
- Supports custom tone selection

### ✅ Slack Notifications (Optional)
- Sends Slack notifications for "Interested" emails
- Requires `SLACK_WEBHOOK_URL` environment variable

### ✅ Database Storage
- MongoDB for email and account storage
- Persistent data across sessions
- Support for filtering and searching

## Troubleshooting

### Python Backend Won't Start
- Check if port 8000 is already in use: `lsof -i :8000`
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check MongoDB connection string in `.env`

### API Calls Failing
- Ensure Python backend is running on port 8000
- Check Node.js server logs for proxy errors
- Verify `PYTHON_BACKEND_URL` is set to `http://localhost:8000`

### Email Sync Not Working
- Verify IMAP account credentials (especially for Gmail, use app-specific password)
- Check Python backend logs for IMAP connection errors
- Ensure firewall allows IMAP connections (typically port 993)

### AI Features Not Working
- Verify Google API key is correct and has Generative AI API enabled
- Check quota limits on Google API
- Review Python backend logs for API errors

## Environment Variables

Required:
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: reachinbox)
- `GOOGLE_API_KEY` - Google Gemini API key

Optional:
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications
- `EXTERNAL_WEBHOOK_URL` - External webhook for integrations

## Next Steps

1. Start the Python backend (see Step 2 above)
2. Access the application at http://localhost:8080
3. Add an IMAP account using "Add Account" button
4. Add product knowledge using "Add Knowledge" button
5. Wait for emails to sync from your IMAP account
6. Use "Generate Reply" to see AI-powered suggestions

## Support

For issues or questions, check:
- `python-backend/README.md` - Backend documentation
- `server/index.ts` - Proxy configuration
- `client/pages/Dashboard.tsx` - Frontend API calls

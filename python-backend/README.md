# ReachInbox Python Backend

This is the Python/FastAPI backend for the ReachInbox email aggregator. It handles:

- IMAP email synchronization
- AI-powered email categorization using Google Gemini
- Email reply generation with multiple variants
- MongoDB storage
- Slack notifications for interested emails

## Prerequisites

- Python 3.9+
- pip or conda
- MongoDB Atlas account
- Google API key for Gemini

## Installation

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your configuration:
```bash
MONGO_URL=your_mongodb_connection_string
DB_NAME=reachinbox
GOOGLE_API_KEY=your_gemini_api_key
SLACK_WEBHOOK_URL=optional_slack_webhook
EXTERNAL_WEBHOOK_URL=optional_webhook
```

## Running the Backend

```bash
python main.py
```

The backend will start on `http://localhost:8000`

## API Endpoints

### Accounts
- `GET /api/accounts/list` - List all configured IMAP accounts
- `POST /api/accounts/add` - Add a new IMAP account

### Emails
- `GET /api/emails` - Get emails (supports filtering by account, folder, category)
- `GET /api/emails/{email_id}` - Get a specific email
- `POST /api/emails/{email_id}/suggest-reply` - Generate AI reply suggestion
- `POST /api/emails/generate-reply` - Generate reply variants

### Knowledge Base
- `GET /api/knowledge/list` - List stored product knowledge
- `POST /api/knowledge/add` - Add product knowledge

### Stats
- `GET /api/stats` - Get email statistics

## Integration with Node.js Frontend

The Node.js server proxies all API requests to this Python backend. Make sure:

1. Python backend is running on port 8000
2. Node.js server has `PYTHON_BACKEND_URL=http://localhost:8000` environment variable
3. Both servers are running for full functionality

## Environment Variables

Required:
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - MongoDB database name
- `GOOGLE_API_KEY` - Google Gemini API key

Optional:
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications
- `EXTERNAL_WEBHOOK_URL` - External webhook for integrations
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins (default: *)

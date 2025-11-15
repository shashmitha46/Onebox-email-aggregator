from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import os
import logging
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from imapclient import IMAPClient
import email
from email.header import decode_header
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'reachinbox')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Configure Gemini
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
MODEL = "gemini-1.5-flash"

# Create FastAPI app
app = FastAPI(
    title="ReachInbox Backend",
    description="AI-powered email aggregator backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for IMAP connections
imap_connections = {}
imap_sync_tasks = {}

# ==================== MODELS ====================

class EmailMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account: str
    folder: str = "INBOX"
    subject: str
    sender: str
    recipient: str
    body: str
    date: str
    ai_category: Optional[str] = None
    read: bool = False
    suggested_reply: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class IMAPAccount(BaseModel):
    email: str
    password: str
    server: str = "imap.gmail.com"
    port: int = 993

class ProductKnowledge(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class ReplyGenerationRequest(BaseModel):
    incoming_email: str
    user_name: str
    booking_link: Optional[str] = None
    tone: str = "professional"

# ==================== AI FUNCTIONS ====================

async def categorize_email(subject: str, body: str) -> str:
    """Categorize email using Gemini AI"""
    try:
        system_message = """You are an email categorization AI. Analyze the email and respond with ONLY ONE of these categories:
- Interested
- Meeting Booked
- Not Interested
- Spam
- Out of Office

Respond with just the category name, nothing else."""
        
        user_message = f"Subject: {subject}\n\nBody: {body[:500]}"
        
        model = genai.GenerativeModel(MODEL, system_instruction=system_message)
        response = model.generate_content(user_message)
        category = response.text.strip()
        
        valid_categories = ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]
        if category not in valid_categories:
            return "Not Interested"
        
        return category
    except Exception as e:
        logger.error(f"Error categorizing email: {e}")
        return "Not Interested"

async def generate_reply_variants(
    incoming_email: str,
    user_name: str,
    booking_link: Optional[str],
    tone: str
) -> Dict[str, str]:
    """Generate AI-powered reply variants using Gemini"""
    try:
        system_prompt = (
            "You are a concise assistant that writes professional email replies. "
            "Use the user profile and booking link to produce three variants: short, medium, detailed. "
            "Return valid JSON: {\"short\": \"...\", \"medium\": \"...\", \"detailed\": \"...\"}."
        )
        
        retrieved_text = "No specific context provided."
        
        user_prompt = (
            f"Incoming email:\n\"\"\"{incoming_email}\"\"\"\n\n"
            f"User name: {user_name}\nBooking link: {booking_link or 'None'}\nPreferred tone: {tone}\n\n"
            f"Retrieved context:\n{retrieved_text}\n\n"
            "Instructions:\n"
            "- If the incoming email asks to schedule, include the booking link as: \"You can book a time here: {booking_link}\".\n"
            "- Keep short <=1 sentence, medium 1-2 sentences, detailed up to 3 sentences.\n\n"
            "Return only valid JSON with keys: short, medium, detailed"
        )
        
        model = genai.GenerativeModel(MODEL, system_instruction=system_prompt)
        response = model.generate_content(user_prompt)
        text = response.text.strip()
        
        # Parse JSON response
        try:
            j = json.loads(text)
            return {
                "short": j.get("short", ""),
                "medium": j.get("medium", ""),
                "detailed": j.get("detailed", "")
            }
        except json.JSONDecodeError:
            # Fallback: extract JSON from text
            import re
            m = re.search(r"\{[\s\S]*\}", text)
            if m:
                try:
                    j = json.loads(m.group(0))
                    return {
                        "short": j.get("short", ""),
                        "medium": j.get("medium", ""),
                        "detailed": j.get("detailed", "")
                    }
                except:
                    pass
            
            return {
                "short": text[:100],
                "medium": text[:300],
                "detailed": text
            }
    except Exception as e:
        logger.error(f"Error generating reply: {e}")
        return {
            "short": "Thank you for reaching out.",
            "medium": "Thank you for reaching out. I appreciate your interest.",
            "detailed": f"Thank you for reaching out. I appreciate your interest and would love to discuss further. Error: {str(e)}"
        }

# ==================== NOTIFICATION FUNCTIONS ====================

async def send_slack_notification(email_data: Dict[str, Any]):
    """Send Slack notification for interested emails"""
    slack_url = os.environ.get('SLACK_WEBHOOK_URL', '')
    if not slack_url:
        logger.warning("Slack webhook URL not configured")
        return
    
    try:
        payload = {
            "text": f"🎯 New Interested Email!",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "📧 New Interested Lead"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*From:*\n{email_data['sender']}"},
                        {"type": "mrkdwn", "text": f"*Subject:*\n{email_data['subject']}"},
                        {"type": "mrkdwn", "text": f"*Account:*\n{email_data['account']}"},
                        {"type": "mrkdwn", "text": f"*Date:*\n{email_data['date']}"}
                    ]
                }
            ]
        }
        
        response = requests.post(slack_url, json=payload, timeout=5)
        if response.status_code == 200:
            logger.info(f"Slack notification sent for email: {email_data['subject']}")
    except Exception as e:
        logger.error(f"Error sending Slack notification: {e}")

# ==================== IMAP FUNCTIONS ====================

def decode_email_header(header):
    """Decode email header"""
    if header is None:
        return ""
    decoded = decode_header(header)
    result = []
    for content, encoding in decoded:
        if isinstance(content, bytes):
            result.append(content.decode(encoding or 'utf-8', errors='ignore'))
        else:
            result.append(str(content))
    return ' '.join(result)

def get_email_body(msg):
    """Extract email body from message"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            body = str(msg.get_payload())
    return body[:2000]

async def sync_imap_account(account: IMAPAccount):
    """Sync IMAP account and fetch emails"""
    account_key = account.email
    logger.info(f"Starting IMAP sync for {account_key}")
    
    try:
        # Connect to IMAP server
        imap = IMAPClient(account.server, port=account.port, use_uid=True, ssl=True)
        imap.login(account.email, account.password)
        imap_connections[account_key] = imap
        
        # Select INBOX
        imap.select_folder('INBOX')
        
        # Fetch last 30 days of emails
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        messages = imap.search(['SINCE', thirty_days_ago.date()])
        
        logger.info(f"Found {len(messages)} messages in last 30 days for {account_key}")
        
        # Process emails (limit to avoid overload)
        for msg_id in list(messages)[:50]:
            try:
                raw_message = imap.fetch([msg_id], ['RFC822'])[msg_id]
                email_message = email.message_from_bytes(raw_message[b'RFC822'])
                
                subject = decode_email_header(email_message.get('Subject', ''))
                sender = decode_email_header(email_message.get('From', ''))
                recipient = decode_email_header(email_message.get('To', ''))
                body = get_email_body(email_message)
                
                # Categorize with AI
                category = await categorize_email(subject, body)
                
                # Create email document
                email_doc = {
                    "id": str(uuid.uuid4()),
                    "account": account.email,
                    "folder": "INBOX",
                    "subject": subject or "(No Subject)",
                    "sender": sender,
                    "recipient": recipient,
                    "body": body,
                    "date": datetime.now(timezone.utc).isoformat(),
                    "ai_category": category,
                    "read": False,
                    "suggested_reply": None,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Check if already exists
                existing = await db.emails.find_one({
                    "account": account.email,
                    "subject": subject,
                    "sender": sender
                })
                
                if not existing:
                    await db.emails.insert_one(email_doc)
                    logger.info(f"Stored email: {subject[:50]}... Category: {category}")
                    
                    # Send notifications for "Interested" emails
                    if category == "Interested":
                        asyncio.create_task(send_slack_notification(email_doc))
                
            except Exception as e:
                logger.error(f"Error processing message {msg_id}: {e}")
                continue
        
        logger.info(f"IMAP sync completed for {account_key}")
        
    except Exception as e:
        logger.error(f"Error syncing IMAP account {account_key}: {e}")
    finally:
        if account_key in imap_connections:
            try:
                imap_connections[account_key].logout()
            except:
                pass
            del imap_connections[account_key]

# ==================== API ROUTES ====================

@app.get("/")
async def root():
    return {
        "message": "ReachInbox Backend",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/accounts/add")
async def add_imap_account(account: IMAPAccount, background_tasks: BackgroundTasks):
    """Add and start syncing an IMAP account"""
    try:
        # Test connection
        test_imap = IMAPClient(account.server, port=account.port, use_uid=True, ssl=True)
        test_imap.login(account.email, account.password)
        test_imap.logout()
        
        # Store account info (excluding password)
        account_doc = {
            "email": account.email,
            "server": account.server,
            "port": account.port,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.imap_accounts.update_one(
            {"email": account.email},
            {"$set": account_doc},
            upsert=True
        )
        
        # Start background sync task
        if account.email not in imap_sync_tasks:
            task = asyncio.create_task(sync_imap_account(account))
            imap_sync_tasks[account.email] = task
        
        return {
            "status": "success",
            "message": f"Account {account.email} added and sync started",
            "account": account.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add account: {str(e)}")

@app.get("/api/accounts/list")
async def list_accounts():
    """List all configured IMAP accounts"""
    accounts = await db.imap_accounts.find({}, {"_id": 0}).to_list(100)
    return {
        "accounts": accounts,
        "active_syncs": list(imap_sync_tasks.keys())
    }

@app.get("/api/emails")
async def get_emails(
    account: Optional[str] = None,
    folder: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
):
    """Get emails with optional filters"""
    query = {}
    if account:
        query["account"] = account
    if folder:
        query["folder"] = folder
    if category:
        query["ai_category"] = category
    
    emails = await db.emails.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return emails

@app.get("/api/emails/{email_id}")
async def get_email(email_id: str):
    """Get a specific email by ID"""
    email_doc = await db.emails.find_one({"id": email_id}, {"_id": 0})
    if not email_doc:
        raise HTTPException(status_code=404, detail="Email not found")
    return email_doc

@app.post("/api/emails/{email_id}/suggest-reply")
async def suggest_reply(email_id: str):
    """Generate AI-powered reply suggestion for an email"""
    email_doc = await db.emails.find_one({"id": email_id}, {"_id": 0})
    if not email_doc:
        raise HTTPException(status_code=404, detail="Email not found")
    
    variants = await generate_reply_variants(
        incoming_email=email_doc['body'],
        user_name="User",
        booking_link=None,
        tone="professional"
    )
    
    # Store suggestion (use the medium variant)
    await db.emails.update_one(
        {"id": email_id},
        {"$set": {"suggested_reply": variants.get("medium", "")}}
    )
    
    return {
        "email_id": email_id,
        "suggested_reply": variants.get("medium", ""),
        "variants": variants
    }

@app.post("/api/emails/generate-reply")
async def generate_reply(request: ReplyGenerationRequest):
    """Generate reply variants for an email"""
    try:
        variants = await generate_reply_variants(
            incoming_email=request.incoming_email,
            user_name=request.user_name,
            booking_link=request.booking_link,
            tone=request.tone
        )
        return {
            "status": "success",
            "variants": variants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/knowledge/add")
async def add_product_knowledge(knowledge: ProductKnowledge):
    """Add product knowledge to database"""
    try:
        doc_id = str(uuid.uuid4())
        knowledge_doc = {
            "id": doc_id,
            "content": knowledge.content,
            "metadata": knowledge.metadata or {},
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.knowledge.insert_one(knowledge_doc)
        
        return {
            "status": "success",
            "message": "Knowledge added successfully",
            "id": doc_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add knowledge: {str(e)}")

@app.get("/api/knowledge/list")
async def list_knowledge():
    """List stored product knowledge"""
    try:
        knowledge = await db.knowledge.find({}, {"_id": 0}).to_list(100)
        return {
            "knowledge": knowledge,
            "count": len(knowledge)
        }
    except Exception as e:
        logger.error(f"Error listing knowledge: {e}")
        return {"knowledge": [], "count": 0}

@app.get("/api/stats")
async def get_stats():
    """Get email statistics"""
    total = await db.emails.count_documents({})
    
    categories = {}
    for category in ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]:
        count = await db.emails.count_documents({"ai_category": category})
        categories[category] = count
    
    accounts = await db.imap_accounts.count_documents({})
    
    return {
        "total_emails": total,
        "categories": categories,
        "accounts_configured": accounts,
        "active_syncs": len(imap_sync_tasks)
    }

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    # Stop all IMAP sync tasks
    for email, task in imap_sync_tasks.items():
        task.cancel()
    
    # Close MongoDB connection
    client.close()
    logger.info("Shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

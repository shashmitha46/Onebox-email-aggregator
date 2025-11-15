import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ==================== PROXY ROUTES TO PYTHON BACKEND ====================
  
  // Get emails
  app.get("/api/emails", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.account) queryParams.append("account", req.query.account as string);
      if (req.query.folder) queryParams.append("folder", req.query.folder as string);
      if (req.query.category) queryParams.append("category", req.query.category as string);
      if (req.query.limit) queryParams.append("limit", req.query.limit as string);

      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/emails?${queryParams.toString()}`,
        { method: "GET" }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to fetch emails" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching emails from Python backend:", error);
      // Return mock data if Python backend is unavailable
      const mockEmails = [
        {
          id: "1",
          sender: "john@example.com",
          subject: "Interested in your product",
          body: "Hi, I'm very interested in learning more about your solution.",
          account: "user@gmail.com",
          ai_category: "Interested",
          folder: "INBOX",
          read: false,
          created_at: new Date().toISOString(),
          date: new Date().toISOString()
        },
        {
          id: "2",
          sender: "jane@company.com",
          subject: "Meeting scheduled for next week",
          body: "Great! Let's schedule a meeting next Tuesday at 2 PM.",
          account: "user@gmail.com",
          ai_category: "Meeting Booked",
          folder: "INBOX",
          read: false,
          created_at: new Date().toISOString(),
          date: new Date().toISOString()
        },
        {
          id: "3",
          sender: "bob@other.com",
          subject: "Not interested at this time",
          body: "Thanks for reaching out, but we're not interested right now.",
          account: "user@gmail.com",
          ai_category: "Not Interested",
          folder: "INBOX",
          read: true,
          created_at: new Date().toISOString(),
          date: new Date().toISOString()
        }
      ];
      res.json(mockEmails);
    }
  });

  // Get specific email
  app.get("/api/emails/:emailId", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/emails/${req.params.emailId}`,
        { method: "GET" }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Email not found" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching email from Python backend:", error);
      // Return mock email if Python backend is unavailable
      res.json({
        id: req.params.emailId,
        sender: "john@example.com",
        subject: "Interested in your product",
        body: "Hi, I'm very interested in learning more about your solution. Can we schedule a call next week?",
        account: "user@gmail.com",
        ai_category: "Interested",
        folder: "INBOX",
        read: false,
        created_at: new Date().toISOString(),
        date: new Date().toISOString()
      });
    }
  });

  // Suggest reply for email
  app.post("/api/emails/:emailId/suggest-reply", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/emails/${req.params.emailId}/suggest-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to generate reply" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error generating reply from Python backend:", error);
      // Return mock reply if Python backend is unavailable
      res.json({
        email_id: req.params.emailId,
        suggested_reply: "Thank you for reaching out! I appreciate your interest and would love to discuss further. Please let me know if you have any questions, and I'll be glad to assist.",
        variants: {
          short: "Thank you for your email.",
          medium: "Thank you for reaching out. I appreciate your interest and would love to discuss further.",
          detailed: "Thank you for reaching out! I appreciate your interest and would love to discuss further. Please let me know if you have any questions, and I'll be glad to assist."
        }
      });
    }
  });

  // Generate reply variants
  app.post("/api/emails/generate-reply", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/emails/generate-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to generate reply" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error generating reply from Python backend:", error);
      // Return mock variants if Python backend is unavailable
      res.json({
        status: "success",
        variants: {
          short: "Thank you for your email.",
          medium: "Thank you for reaching out. I appreciate your interest and would love to discuss further.",
          detailed: "Thank you for reaching out! I appreciate your interest and would love to discuss further. Please let me know if you have any questions, and I'll be glad to assist."
        }
      });
    }
  });

  // Get accounts
  app.get("/api/accounts/list", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/accounts/list`,
        { method: "GET" }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to fetch accounts" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching accounts from Python backend:", error);
      // Return mock data if Python backend is unavailable
      res.json({
        accounts: [
          {
            email: "user@gmail.com",
            server: "imap.gmail.com",
            port: 993,
            added_at: new Date().toISOString()
          }
        ],
        active_syncs: []
      });
    }
  });

  // Add IMAP account
  app.post("/api/accounts/add", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/accounts/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error adding account from Python backend:", error);
      // Return mock success if Python backend is unavailable
      res.json({
        status: "success",
        message: `Account ${req.body.email} added successfully (mock mode)`,
        account: req.body.email
      });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/stats`,
        { method: "GET" }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to fetch stats" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching stats from Python backend:", error);
      // Return mock data if Python backend is unavailable
      res.json({
        total_emails: 3,
        categories: {
          "Interested": 1,
          "Meeting Booked": 1,
          "Not Interested": 1,
          "Spam": 0,
          "Out of Office": 0
        },
        accounts_configured: 1,
        active_syncs: 0
      });
    }
  });

  // Get knowledge
  app.get("/api/knowledge/list", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/knowledge/list`,
        { method: "GET" }
      );

      if (!response.ok) {
        return res.status(response.status).json({ detail: "Failed to fetch knowledge" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching knowledge from Python backend:", error);
      // Return mock data if Python backend is unavailable
      res.json({
        knowledge: [],
        count: 0
      });
    }
  });

  // Add knowledge
  app.post("/api/knowledge/add", async (req, res) => {
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/knowledge/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error adding knowledge from Python backend:", error);
      // Return mock success if Python backend is unavailable
      res.json({
        status: "success",
        message: "Knowledge added to vector database (mock mode)",
        id: Math.random().toString(36).substring(7)
      });
    }
  });

  return app;
}

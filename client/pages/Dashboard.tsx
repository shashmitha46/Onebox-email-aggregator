import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Mail,
  Search,
  Plus,
  Inbox,
  TrendingUp,
  Calendar,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Database,
  BarChart3,
  Filter,
  RefreshCw,
  Send,
  User,
  LogOut
} from 'lucide-react';

const API_BASE = '/api';

interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  account: string;
  ai_category: string;
  timestamp?: string;
}

interface Account {
  email: string;
  server?: string;
  port?: number;
}

interface Stats {
  total_emails: number;
  categories: Record<string, number>;
  accounts_configured: number;
}

const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'john.doe@example.com',
    subject: 'Following up on our conversation',
    body: 'Hi, I wanted to follow up on the discussion we had last week about the project. Would you be available for a call this week?',
    account: 'your@email.com',
    ai_category: 'Interested',
    timestamp: '2 hours ago'
  }
];

const mockStats: Stats = {
  total_emails: 1,
  categories: {
    'Interested': 1,
    'Meeting Booked': 0,
    'Not Interested': 0,
    'Spam': 0,
    'Out of Office': 0
  },
  accounts_configured: 0
};

interface DashboardProps {
  user: { email: string; timestamp: number } | null;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>(mockEmails);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats>(mockStats);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  const [accountForm, setAccountForm] = useState({
    email: '',
    password: '',
    server: 'imap.gmail.com',
    port: 993
  });

  const [knowledgeForm, setKnowledgeForm] = useState({
    content: '',
    metadata: '{}'
  });

  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, categoryFilter, accountFilter, searchQuery]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchEmails(),
        fetchAccounts(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    try {
      const response = await fetch(`${API_BASE}/emails?limit=100`);
      if (!response.ok) {
        console.error('Error fetching emails: HTTP', response.status);
        return;
      }
      const data = await response.json();
      setEmails(Array.isArray(data) ? data : data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/accounts/list`);
      if (!response.ok) {
        console.error('Error fetching accounts: HTTP', response.status);
        return;
      }
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) {
        console.error('Error fetching stats: HTTP', response.status);
        return;
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterEmails = () => {
    let filtered = [...emails];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.ai_category === categoryFilter);
    }

    if (accountFilter !== 'all') {
      filtered = filtered.filter(e => e.account === accountFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.subject?.toLowerCase().includes(query) ||
        e.sender?.toLowerCase().includes(query) ||
        e.body?.toLowerCase().includes(query)
      );
    }

    setFilteredEmails(filtered);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/accounts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });

      if (response.ok) {
        toast.success('Account added successfully! Syncing emails...');
        setIsAddAccountOpen(false);
        setAccountForm({ email: '', password: '', server: 'imap.gmail.com', port: 993 });
        await fetchAccounts();
        setTimeout(fetchEmails, 5000);
      } else {
        try {
          const error = await response.json();
          toast.error(error.detail || 'Failed to add account');
        } catch {
          toast.error('Failed to add account');
        }
      }
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let metadata = {};
      try {
        metadata = JSON.parse(knowledgeForm.metadata);
      } catch {}

      const response = await fetch(`${API_BASE}/knowledge/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: knowledgeForm.content,
          metadata
        })
      });

      if (response.ok) {
        toast.success('Knowledge added to vector database!');
        setIsAddKnowledgeOpen(false);
        setKnowledgeForm({ content: '', metadata: '{}' });
      } else {
        try {
          const error = await response.json();
          toast.error(error.detail || 'Failed to add knowledge');
        } catch {
          toast.error('Failed to add knowledge');
        }
      }
    } catch (error) {
      console.error('Error adding knowledge:', error);
      toast.error('Failed to add knowledge');
    }
  };

  const handleGenerateReply = async (emailId: string) => {
    setLoadingReply(true);
    setSuggestedReply('');
    try {
      const response = await fetch(`${API_BASE}/emails/${emailId}/suggest-reply`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedReply(data.suggested_reply);
        toast.success('Reply suggestion generated!');
      } else {
        console.error('Error generating reply: HTTP', response.status);
        toast.error('Failed to generate reply');
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      toast.error('Failed to generate reply');
    } finally {
      setLoadingReply(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Interested': return <TrendingUp className="w-3 h-3" />;
      case 'Meeting Booked': return <Calendar className="w-3 h-3" />;
      case 'Not Interested': return <XCircle className="w-3 h-3" />;
      case 'Spam': return <AlertCircle className="w-3 h-3" />;
      case 'Out of Office': return <Clock className="w-3 h-3" />;
      default: return <Mail className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Interested': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      case 'Meeting Booked': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      case 'Not Interested': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
      case 'Spam': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      case 'Out of Office': return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center space-y-4">
          <div className="inline-block animate-pulse">
            <Mail className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Loading ReachInbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" style={{fontFamily: 'Space Grotesk'}}>ReachInbox</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Email Aggregator</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {user && (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Dialog open={isAddKnowledgeOpen} onOpenChange={setIsAddKnowledgeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Database className="w-4 h-4" />
                    Add Knowledge
                  </Button>
                </DialogTrigger>
                <DialogContent className="dark:bg-slate-900">
                  <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">Add Product Knowledge</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Add information to the vector database for AI-powered reply suggestions.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddKnowledge} className="space-y-4">
                    <div>
                      <Label htmlFor="knowledge-content" className="dark:text-slate-200">Content</Label>
                      <Textarea
                        id="knowledge-content"
                        placeholder="E.g., Our company offers AI-powered email solutions. Book a demo at https://cal.com/example"
                        value={knowledgeForm.content}
                        onChange={(e) => setKnowledgeForm({...knowledgeForm, content: e.target.value})}
                        rows={5}
                        required
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="knowledge-metadata" className="dark:text-slate-200">Metadata (JSON)</Label>
                      <Input
                        id="knowledge-metadata"
                        placeholder='{"type": "product_info"}'
                        value={knowledgeForm.metadata}
                        onChange={(e) => setKnowledgeForm({...knowledgeForm, metadata: e.target.value})}
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="dark:bg-slate-900">
                  <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">Add IMAP Account</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                      Connect your email account for real-time synchronization.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAccount} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="dark:text-slate-200">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({...accountForm, email: e.target.value})}
                        required
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="dark:text-slate-200">App Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••••••"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({...accountForm, password: e.target.value})}
                        required
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use app-specific password for Gmail</p>
                    </div>
                    <div>
                      <Label htmlFor="server" className="dark:text-slate-200">IMAP Server</Label>
                      <Input
                        id="server"
                        placeholder="imap.gmail.com"
                        value={accountForm.server}
                        onChange={(e) => setAccountForm({...accountForm, server: e.target.value})}
                        required
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port" className="dark:text-slate-200">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        placeholder="993"
                        value={accountForm.port}
                        onChange={(e) => setAccountForm({...accountForm, port: parseInt(e.target.value)})}
                        required
                        className="dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <Card className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Total Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total_emails}</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Interested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.categories.Interested || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.categories['Meeting Booked'] || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.accounts_configured}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search emails by subject, sender, or content..."
                    className="pl-10 dark:bg-slate-800 dark:text-slate-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] dark:bg-slate-800 dark:text-slate-100">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Meeting Booked">Meeting Booked</SelectItem>
                  <SelectItem value="Not Interested">Not Interested</SelectItem>
                  <SelectItem value="Spam">Spam</SelectItem>
                  <SelectItem value="Out of Office">Out of Office</SelectItem>
                </SelectContent>
              </Select>

              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-full md:w-[200px] dark:bg-slate-800 dark:text-slate-100">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:text-slate-100">
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.email} value={acc.email}>{acc.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchEmails}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Mail className="w-5 h-5" />
                  Emails ({filteredEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[calc(100vh-400px)] overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No emails found</p>
                      <p className="text-sm mt-1">Add an account to start syncing</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            selectedEmail?.id === email.id ? 'bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedEmail(email);
                            setSuggestedReply('');
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {email.sender}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email.account}</p>
                            </div>
                            <Badge className={`${getCategoryColor(email.ai_category)} text-xs flex items-center gap-1 shrink-0 ml-2`}>
                              {getCategoryIcon(email.ai_category)}
                              {email.ai_category}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1">
                            {email.subject}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {email.body?.substring(0, 60)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-2">
            {selectedEmail ? (
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 dark:text-slate-100">{selectedEmail.subject}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {selectedEmail.sender}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedEmail.account}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getCategoryColor(selectedEmail.ai_category)} flex items-center gap-1`}>
                      {getCategoryIcon(selectedEmail.ai_category)}
                      {selectedEmail.ai_category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[400px] mb-6 overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{selectedEmail.body}</p>
                    </div>
                  </div>

                  <Separator className="my-6 dark:bg-slate-800" />

                  {/* AI Reply Suggestion */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-slate-100">
                        <Sparkles className="w-5 h-5 text-green-500" />
                        AI Reply Suggestion
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReply(selectedEmail.id)}
                        disabled={loadingReply}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loadingReply ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Generate Reply
                      </Button>
                    </div>

                    {suggestedReply && (
                      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 animate-fade-in">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{suggestedReply}</p>
                        </CardContent>
                      </Card>
                    )}

                    {loadingReply && (
                      <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">Generating AI-powered reply...</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900">
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center text-slate-400">
                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select an email to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

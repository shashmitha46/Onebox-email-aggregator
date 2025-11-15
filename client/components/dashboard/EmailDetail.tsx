import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  category: "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office";
  read: boolean;
}

interface EmailDetailProps {
  email: Email | null;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Interested":
      return "bg-success/20 text-success";
    case "Meeting Booked":
      return "bg-blue-500/20 text-blue-500";
    case "Not Interested":
      return "bg-red-500/20 text-red-500";
    case "Spam":
      return "bg-gray-500/20 text-gray-500";
    case "Out of Office":
      return "bg-yellow-500/20 text-yellow-500";
    default:
      return "bg-gray-500/20 text-gray-500";
  }
};

export default function EmailDetail({ email }: EmailDetailProps) {
  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
        <p className="text-muted-foreground">Select an email to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">From</p>
            <p className="font-semibold text-foreground">{email.from}</p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              getCategoryColor(email.category)
            )}
          >
            {email.category}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Subject</p>
          <p className="text-lg font-bold text-foreground">{email.subject}</p>
        </div>

        <p className="text-sm text-muted-foreground">{email.timestamp}</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{email.preview}</p>
        </div>
      </div>

      <div className="p-6 border-t border-border bg-muted/50">
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-semibold transition-colors">
            Reply
          </button>
          <button className="flex-1 px-4 py-2 border border-border hover:bg-muted rounded-lg font-semibold transition-colors">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

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

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onSelectEmail: (email: Email) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Interested":
      return "text-success";
    case "Meeting Booked":
      return "text-blue-500";
    case "Not Interested":
      return "text-red-500";
    case "Spam":
      return "text-gray-500";
    case "Out of Office":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
};

export default function EmailList({
  emails,
  selectedEmail,
  onSelectEmail,
}: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
        <p className="text-muted-foreground mb-2">No emails found</p>
        <p className="text-sm text-muted-foreground">
          Add an account to start syncing emails
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-border">
        <p className="text-sm font-semibold text-foreground">
          Emails ({emails.length})
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className={cn(
              "p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted",
              selectedEmail?.id === email.id && "bg-muted"
            )}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {email.from}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {email.timestamp}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground truncate mb-1">
                  {email.subject}
                </p>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {email.preview}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      getCategoryColor(email.category)
                    )}
                  >
                    {email.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

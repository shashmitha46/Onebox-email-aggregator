import { Mail, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  onAddAccount: () => void;
  onAddKnowledge: () => void;
}

export default function Header({ onAddAccount, onAddKnowledge }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Reachinbox</h1>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                AI-Powered Email Aggregator
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="rounded-lg flex-shrink-0"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onAddKnowledge}
              className="rounded-lg text-xs sm:text-sm whitespace-nowrap"
            >
              + Add Knowledge
            </Button>

            <Button
              onClick={onAddAccount}
              className="bg-success hover:bg-success/90 text-white rounded-lg flex-shrink-0 text-xs sm:text-sm whitespace-nowrap"
              size="sm"
            >
              + Add Account
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

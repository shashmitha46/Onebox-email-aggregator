import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAccountModal({
  open,
  onOpenChange,
}: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    imapServer: "",
    imapPort: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding account:", formData);
    onOpenChange(false);
    setFormData({ email: "", password: "", imapServer: "", imapPort: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add IMAP Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use app-specific password for Gmail
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imapServer">IMAP Server</Label>
            <Input
              id="imapServer"
              name="imapServer"
              type="text"
              placeholder="imap.gmail.com"
              value={formData.imapServer}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imapPort">IMAP Port</Label>
            <Input
              id="imapPort"
              name="imapPort"
              type="text"
              placeholder="993"
              value={formData.imapPort}
              onChange={handleChange}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-success hover:bg-success/90 text-white"
          >
            + Add Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

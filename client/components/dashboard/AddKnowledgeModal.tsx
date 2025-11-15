import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKnowledgeModal({
  open,
  onOpenChange,
}: AddKnowledgeModalProps) {
  const [formData, setFormData] = useState({
    content: "",
    context: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding knowledge:", formData);
    onOpenChange(false);
    setFormData({ content: "", context: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Knowledge Base</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Add information to the vector database for AI-powered reply suggestions.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="E.g., Our company offers AI-powered email solutions. Book a demo at https://cal.com/example"
              value={formData.content}
              onChange={handleChange}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Input
              id="context"
              name="context"
              type="text"
              placeholder="Describe the context for this knowledge"
              value={formData.context}
              onChange={handleChange}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-success hover:bg-success/90 text-white"
          >
            + Add Knowledge
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  color: "success" | "primary" | "secondary" | "muted";
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: StatsCardProps) {
  const colorClasses = {
    success: "border-success text-success",
    primary: "border-primary text-primary",
    secondary: "border-secondary text-secondary",
    muted: "border-muted text-muted-foreground",
  };

  return (
    <div className={cn(
      "border-2 rounded-lg p-6 bg-card",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-50" />
      </div>
    </div>
  );
}

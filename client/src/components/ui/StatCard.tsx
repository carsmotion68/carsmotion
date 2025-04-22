import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  change?: {
    value: string;
    positive?: boolean;
    text: string;
  };
  valueColor?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-secondary",
  change,
  valueColor
}: StatCardProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">{title}</p>
            <h3 className={cn("text-2xl font-bold", valueColor)}>{value}</h3>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            <div className={cn("text-2xl", iconColor)}>{icon}</div>
          </div>
        </div>
        
        {change && (
          <div className="mt-2 text-xs">
            <span className={cn("font-medium", change.positive ? "text-success" : "text-accent")}>
              {change.positive ? "▲" : "▼"} {change.value}
            </span>{" "}
            {change.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;

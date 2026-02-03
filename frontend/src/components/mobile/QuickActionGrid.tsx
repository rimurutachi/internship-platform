import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  color: string;
  onClick?: () => void;
}

interface QuickActionGridProps {
  actions: QuickAction[];
}

export const QuickActionGrid = ({ actions }: QuickActionGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card 
            key={index}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95",
              "min-h-[100px]"
            )}
            onClick={action.onClick}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 h-full">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                action.color
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center text-foreground">
                {action.label}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

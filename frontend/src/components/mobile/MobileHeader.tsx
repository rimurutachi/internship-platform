import { Bell, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  notificationCount?: number;
  onMenuClick?: () => void;
}

export const MobileHeader = ({ 
  title, 
  subtitle, 
  logo,
  notificationCount = 0,
  onMenuClick 
}: MobileHeaderProps) => {
  return (
    <header className="lg:hidden sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {logo && <div className="w-8 h-8">{logo}</div>}
          
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
};

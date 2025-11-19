'use client';

import { Bell, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * SupervisorHeader Component
 * 
 * Header component for supervisor dashboard with welcome message,
 * AI evaluation badge, notifications, and profile dropdown menu.
 */
export const SupervisorHeader = () => {
  // TODO: Replace with actual user data from context/API
  const notificationCount = 8;

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, Maria!</h1>
          <p className="text-muted-foreground">TechCorp Solutions • Senior Developer • Intern Supervisor</p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {/* AI Evaluation Badge */}
          <Badge className="bg-gradient-ai text-white border-0 px-3 py-1.5">
            <Sparkles className="w-4 h-4 mr-2" />
            SMART EVALUATION
          </Badge>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-xs p-0 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" aria-label="User menu">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg" alt="Supervisor" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">MS</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100]" sideOffset={8}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Company Info</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};


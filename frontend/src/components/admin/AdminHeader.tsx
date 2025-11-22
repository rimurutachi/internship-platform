'use client';

import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { logout } from '@/lib/auth';
import { useUserContext } from '@/components/providers/UserProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * AdminHeader Component
 * 
 * Header component for admin dashboard with welcome message,
 * notifications, and profile dropdown menu.
 */
export const AdminHeader = () => {
  const { user } = useUserContext();
  const notificationCount = 5;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin' : 'Admin';
  const initials = user && user.first_name && user.last_name 
    ? getInitials(user.first_name, user.last_name) 
    : 'AD';

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.first_name || 'Admin'}!</h1>
          <p className="text-muted-foreground">{user?.email || 'System Administrator Dashboard'}</p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
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
                  <AvatarImage src="/placeholder.svg" alt={fullName} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100]" sideOffset={8}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>System Preferences</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

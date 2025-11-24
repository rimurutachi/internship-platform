'use client';

import { ChevronDown, LogOut, User, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';
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
  const avatarUrl = user?.profile_data?.avatar_url;

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
          <NotificationsDropdown />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" aria-label="User menu">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatarUrl || '/placeholder.svg'} alt={fullName} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100]" sideOffset={8}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/settings" className="cursor-pointer flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/system" className="cursor-pointer flex items-center">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  System Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/admin/security" className="cursor-pointer flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
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

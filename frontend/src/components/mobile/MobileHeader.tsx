'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsDropdown } from "@/components/ui/NotificationsDropdown";
import { logout } from "@/lib/auth";
import { useUserContext } from "@/components/providers/UserProvider";

import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  onMenuClick?: () => void;
}

export const MobileHeader = ({ 
  title, 
  subtitle, 
  logo,
  onMenuClick 
}: MobileHeaderProps) => {
  // Try to get user context if available (optional - won't break if not wrapped in UserProvider)
  let user = null;
  try {
    const context = useUserContext();
    user = context.user;
  } catch {
    // UserProvider not available - use defaults
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  // Get role-specific navigation paths
  const getRolePaths = () => {
    const role = user?.role || 'student';
    return {
      profile: `/dashboard/${role}/settings`,
      preferences: `/dashboard/${role}/settings`,
      help: `/dashboard/${role}`,
    };
  };

  const paths = getRolePaths();

  return (
    <header className="lg:hidden bg-background border-b border-border z-40 px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden flex-shrink-0 h-9 w-9"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}
          
          {/* Logo */}
          <Image 
            src="/cvsu-logo.png" 
            alt="CvSU Logo" 
            width={32} 
            height={32}
            className="object-contain flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8"
          />
          
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* CVSU Logo */}
          <Image 
            src="/cvsu-logo.png" 
            alt="CvSU Logo" 
            width={28} 
            height={28}
            className="object-contain hidden xs:block w-6 h-6 sm:w-7 sm:h-7"
          />
        </div>
      </div>
    </header>
  );
};

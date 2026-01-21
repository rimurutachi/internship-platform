'use client';

import { Menu, LogOut, User, Settings as SettingsIcon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsDropdown } from "@/components/ui/NotificationsDropdown";
import { logout } from "@/lib/auth";
import { useUserContext } from "@/components/providers/UserProvider";
import Link from 'next/link';
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
    <header className="lg:hidden bg-background border-b border-border z-40 px-4 py-3 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </Button>
          )}
          
          {/* Logo */}
          <Image 
            src="/logo.png" 
            alt="Intern-Galing Logo" 
            width={32} 
            height={32}
            className="object-contain"
          />
          
          <div>
            <h1 className="text-base font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="object-contain"
          />
        </div>
      </div>
    </header>
  );
};

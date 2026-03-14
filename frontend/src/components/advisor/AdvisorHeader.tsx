'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';

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
 * AdvisorHeader Component
 * 
 * Header component for advisor dashboard with welcome message,
 * notifications, and profile dropdown menu.
 */
export const AdvisorHeader = () => {
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

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Advisor' : 'Advisor';
  const initials = user && user.first_name && user.last_name 
    ? getInitials(user.first_name, user.last_name) 
    : 'AD';

  return (
    <header className="bg-background border-b border-border px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: CVSU Branding */}
        <div className="flex items-center space-x-3">
          <Image 
            src="/logo.png" 
            alt="Intern-Galing Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              CAVITE STATE UNIVERSITY - BACOOR CITY CAMPUS
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" aria-label="User menu">
                <span className="text-sm font-medium text-foreground">Log out</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100]" sideOffset={8}>
              <DropdownMenuItem 
                className="text-destructive cursor-pointer font-medium"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CVSU and Bagong Pilipinas Logos */}
          <Image 
            src="/cvsu-logo.png" 
            alt="CvSU Logo" 
            width={32} 
            height={32}
            className="object-contain"
          />
          <Image 
            src="/bagong-pilipinas-logo.png" 
            alt="Bagong Pilipinas Logo" 
            width={32} 
            height={32}
            className="object-contain"
          />
        </div>
      </div>
    </header>
  );
};


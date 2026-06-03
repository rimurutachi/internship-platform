'use client';

import Image from 'next/image';
import { NotificationsDropdown } from '@/components/ui/NotificationsDropdown';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LogoutConfirmDialog } from '@/components/shared/LogoutConfirmDialog';

export const AdvisorHeader = () => {
  return (
    <header className="bg-background border-b border-border px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left: CVSU Branding */}
        <div className="flex items-center space-x-3">
          <Image 
            src="/cvsu-logo.png" 
            alt="CvSU Logo" 
            width={40} 
            height={40}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              CAVITE STATE UNIVERSITY - BACOOR CITY CAMPUS
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <NotificationsDropdown />
          <LogoutConfirmDialog />
          <Image 
            src="/logo.png" 
            alt="Intern-Galing Logo" 
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

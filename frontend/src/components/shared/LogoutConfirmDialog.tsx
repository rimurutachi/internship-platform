'use client';

import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth';
import { useState } from 'react';

interface LogoutConfirmDialogProps {
  /** Render a custom trigger instead of the default button */
  trigger?: React.ReactNode;
  /** Variant style for the default trigger button */
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  /** Show text label alongside icon (default: true) */
  showLabel?: boolean;
  /** Custom class for the trigger */
  className?: string;
}

/**
 * LogoutConfirmDialog
 * 
 * A reusable logout confirmation dialog that shows an AlertDialog
 * before logging the user out. Used across all role headers and
 * mobile bottom navigation.
 */
export const LogoutConfirmDialog = ({
  trigger,
  variant = 'ghost',
  showLabel = true,
  className,
}: LogoutConfirmDialogProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant={variant}
            className={className || 'flex items-center space-x-2'}
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            {showLabel && <span className="text-sm font-medium">Log out</span>}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="z-[200]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-destructive" />
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

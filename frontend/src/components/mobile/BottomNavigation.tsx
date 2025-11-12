'use client';

import { Home, Briefcase, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const studentNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard/student' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/student/internships' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: User, label: 'Profile', path: '/dashboard/student/profile' },
];

const supervisorNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard/supervisor' },
  { icon: Briefcase, label: 'Interns', path: '/dashboard/supervisor/interns' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/supervisor/messages' },
  { icon: User, label: 'Profile', path: '/dashboard/supervisor/profile' },
];

interface BottomNavigationProps {
  type: 'student' | 'supervisor';
}

export const BottomNavigation = ({ type }: BottomNavigationProps) => {
  const pathname = usePathname();
  const navItems = type === 'student' ? studentNavItems : supervisorNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-primary/10')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

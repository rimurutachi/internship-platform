'use client';

import { Home, Briefcase, FileCheck, Settings, Users, Brain, BarChart3, Building2, FileText, LayoutDashboard, MessageSquare } from 'lucide-react';
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
  { icon: Briefcase, label: 'Internship', path: '/dashboard/student/current-internship' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

// Supervisor pages: Dashboard, Interns, Evaluations, Settings
const supervisorNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard/supervisor' },
  { icon: Users, label: 'Interns', path: '/dashboard/supervisor/interns' },
  { icon: Brain, label: 'Evaluations', path: '/dashboard/supervisor/evaluations' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/supervisor/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/supervisor/settings' },
];

const advisorNavItems: NavItem[] = [
  { icon: Users, label: 'Students', path: '/dashboard/advisor/students' },
  { icon: FileText, label: 'Evaluations', path: '/dashboard/advisor/evaluations' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/advisor/documents' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/advisor/messages' },
  { icon: Settings, label: 'Settings', path: '/dashboard/advisor/settings' },
];

const adminNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/admin' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users' },
  { icon: Building2, label: 'Companies', path: '/dashboard/admin/companies' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/admin/internships' },
  { icon: Brain, label: 'Evaluations', path: '/dashboard/admin/evaluations' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/admin/documents' },
  { icon: FileText, label: 'Reports', path: '/dashboard/admin/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/admin/settings' },
];

interface BottomNavigationProps {
  type: 'student' | 'supervisor' | 'advisor' | 'admin';
}

export const BottomNavigation = ({ type }: BottomNavigationProps) => {
  const pathname = usePathname();
  const navItems = type === 'student' 
    ? studentNavItems 
    : type === 'advisor' 
    ? advisorNavItems 
    : type === 'admin'
    ? adminNavItems
    : supervisorNavItems;

  // Calculate min width based on number of items (max 6 items, use flex-1 for even distribution)
  const itemCount = navItems.length;
  const minWidth = itemCount <= 5 ? `${100 / itemCount}%` : 'auto';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex h-14 sm:h-16 overflow-x-auto scrollbar-hide pb-safe">
        {navItems.map((item) => {
          // For Home/dashboard base path, only match exact path. For others, match exact or child paths
          const isBaseDashboard = item.path === '/dashboard/student' || 
                                  item.path === '/dashboard/supervisor' || 
                                  item.path === '/dashboard/advisor' ||
                                  item.path === '/dashboard/admin';
          const isActive = isBaseDashboard
            ? pathname === item.path
            : pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 transition-colors px-1 sm:px-2 flex-1 min-h-[44px]',
                itemCount > 5 && 'min-w-[16.666%]',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
              )}
              style={itemCount <= 5 ? { minWidth } : undefined}
            >
              <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', isActive && 'fill-primary/10')} />
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

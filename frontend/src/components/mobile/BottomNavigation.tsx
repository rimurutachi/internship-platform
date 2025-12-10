'use client';

import { Home, Briefcase, TrendingUp, MessageSquare, FileCheck, Settings, Users, Brain, BarChart3, Building2, Shield, Server, FileText } from 'lucide-react';
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
  { icon: FileText, label: 'Reports', path: '/dashboard/student/weekly-reports' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/student/messages' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/student/documents' },
  { icon: Settings, label: 'Settings', path: '/dashboard/student/settings' },
];

const supervisorNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/supervisor' },
  { icon: Users, label: 'My Interns', path: '/dashboard/supervisor/interns' },
  { icon: Brain, label: 'AI Evaluations', path: '/dashboard/supervisor/evaluations' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/supervisor/messages' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/supervisor/documents' },
  { icon: Building2, label: 'Company', path: '/dashboard/supervisor/company' },
  { icon: Settings, label: 'Settings', path: '/dashboard/supervisor/settings' },
];

const advisorNavItems: NavItem[] = [
  { icon: Users, label: 'Students', path: '/dashboard/advisor/students' },
  { icon: FileText, label: 'Evaluations', path: '/dashboard/advisor/evaluations' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/advisor/messages' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/advisor/documents' },
  { icon: Settings, label: 'Settings', path: '/dashboard/advisor/settings' },
];

const adminNavItems: NavItem[] = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/admin' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users' },
  { icon: Building2, label: 'Companies', path: '/dashboard/admin/companies' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/admin/internships' },
  { icon: Brain, label: 'Evaluations', path: '/dashboard/admin/evaluations' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/admin/documents' },
  { icon: Server, label: 'System', path: '/dashboard/admin/system' },
  { icon: Shield, label: 'Security', path: '/dashboard/admin/security' },
  { icon: FileText, label: 'Reports', path: '/dashboard/admin/reports' },
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
    <nav className="lg:hidden bg-white border-t border-gray-200 z-50 safe-area-inset-bottom shadow-lg">
      <div className="flex h-16 overflow-x-auto scrollbar-hide">
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
                'flex flex-col items-center justify-center space-y-1 transition-colors px-2 flex-1',
                itemCount > 5 && 'min-w-[16.666%]',
                isActive 
                  ? 'text-[#4CAF50]' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
              style={itemCount <= 5 ? { minWidth } : undefined}
            >
              <Icon className={cn('w-5 h-5', isActive && 'fill-[#4CAF50]/10')} />
              <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

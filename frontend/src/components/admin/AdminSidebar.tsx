'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  FileText,
  Settings,
  BarChart3,
  Briefcase,
  Building2,
  FileCheck,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/components/providers/UserProvider';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users' },
  { icon: Building2, label: 'Companies', path: '/dashboard/admin/companies' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/admin/internships' },
  { icon: FileCheck, label: 'Evaluations', path: '/dashboard/admin/evaluations' },
  { icon: ClipboardList, label: 'Weekly Reports', path: '/dashboard/admin/weekly-reports' },
  { icon: ClipboardList, label: 'Rubrics', path: '/dashboard/admin/rubrics' },
  { icon: FileText, label: 'Documents', path: '/dashboard/admin/documents' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/admin/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/admin/settings' },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();

  const getInitials = () => {
    if (!user) return 'AD';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'AD';
  };

  const getDisplayName = () => {
    if (!user) return 'Administrator';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Administrator';
  };

  return (
    <div className="w-64 bg-background border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 bg-background">
        <div className="flex items-center space-x-3">
          <Avatar className="w-14 h-14 border-2 border-primary">
            <AvatarImage src={user?.profile_data?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-foreground text-base">{getDisplayName()}</h3>
            <p className="text-xs text-muted-foreground">admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || 
                           (item.path !== '/dashboard/admin' && pathname?.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

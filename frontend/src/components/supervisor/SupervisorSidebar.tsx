'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  Settings,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/components/providers/UserProvider';

// Supervisor pages: Dashboard, Interns, Evaluations, Settings
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/supervisor' },
  { icon: Users, label: 'My Interns', path: '/dashboard/supervisor/interns' },
  { icon: FileText, label: 'Evaluations', path: '/dashboard/supervisor/evaluations' },
  { icon: Settings, label: 'Settings', path: '/dashboard/supervisor/settings' },
];

export const SupervisorSidebar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();

  const getInitials = () => {
    if (!user) return 'SU';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'SU';
  };

  const getDisplayName = () => {
    if (!user) return 'Supervisor';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Supervisor';
  };

  return (
    <div className="w-56 lg:w-64 bg-background border-r border-border h-screen flex flex-col overflow-y-auto flex-shrink-0">
      {/* User Profile Section */}
      <div className="p-4 lg:p-6 bg-background">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Avatar className="w-10 h-10 lg:w-14 lg:h-14 border-2 border-primary flex-shrink-0">
            <AvatarImage src={user?.profile_data?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm lg:text-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-foreground text-sm lg:text-base truncate">{getDisplayName()}</h3>
            <p className="text-[10px] lg:text-xs text-muted-foreground truncate">Supervisor</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 lg:px-3 py-3 lg:py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || 
                           (item.path !== '/dashboard/supervisor' && pathname?.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm lg:text-base font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};


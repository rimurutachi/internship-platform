'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  Shield,
  FileText,
  Brain,
  Settings,
  BarChart3,
  Briefcase,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/components/providers/UserProvider';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin', emoji: '📊' },
  { icon: Users, label: 'Users', path: '/dashboard/admin/users', emoji: '👥' },
  { icon: Building2, label: 'Companies', path: '/dashboard/admin/companies', emoji: '🏢' },
  { icon: Briefcase, label: 'Internships', path: '/dashboard/admin/internships', emoji: '💼' },
  { icon: Brain, label: 'Evaluations', path: '/dashboard/admin/evaluations', emoji: '🧠' },
  { icon: FileText, label: 'Documents', path: '/dashboard/admin/documents', emoji: '📄' },
  { icon: Server, label: 'System', path: '/dashboard/admin/system', emoji: '🖥️' },
  { icon: Shield, label: 'Security', path: '/dashboard/admin/security', emoji: '🔒' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/admin/reports', emoji: '📈' },
  { icon: Settings, label: 'Settings', path: '/dashboard/admin/settings', emoji: '⚙️' },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin' : 'Admin';
  const initials = user && user.first_name && user.last_name 
    ? getInitials(user.first_name, user.last_name) 
    : 'AD';
  const avatarUrl = user?.profile_data?.avatar_url;

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={avatarUrl || '/placeholder.svg'} alt={fullName} />
            <AvatarFallback className="bg-gradient-primary text-white font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">{user?.role || 'Administrator'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="text-base">{item.emoji}</span>
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

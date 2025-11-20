'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Brain,
  Settings,
  MessageSquare,
  Building2,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/components/providers/UserProvider';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/supervisor', emoji: '📊' },
  { icon: Users, label: 'My Interns', path: '/dashboard/supervisor/interns', emoji: '👥' },
  { icon: Brain, label: 'AI Evaluations', path: '/dashboard/supervisor/evaluations', emoji: '🤖' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/supervisor/messages', emoji: '💬' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/supervisor/documents', emoji: '📄' },
  { icon: Building2, label: 'Company', path: '/dashboard/supervisor/company', emoji: '🏢' },
  { icon: Settings, label: 'Settings', path: '/dashboard/supervisor/settings', emoji: '⚙️' },
];

export const SupervisorSidebar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Supervisor';
  const initials = user ? getInitials(user.first_name, user.last_name) : 'SU';

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" alt={fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">{user?.role || 'Supervisor'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard/supervisor' && pathname?.startsWith(item.path));
            
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


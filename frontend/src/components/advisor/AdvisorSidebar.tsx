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
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/components/providers/UserProvider';

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard/advisor', emoji: '📊' },
  { icon: Users, label: 'My Students', path: '/dashboard/advisor/students', emoji: '👥' },
  { icon: Brain, label: 'AI Evaluations', path: '/dashboard/advisor/evaluations', emoji: '🤖' },
  { icon: FileText, label: 'Analytics', path: '/dashboard/advisor/analytics', emoji: '📈' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/advisor/messages', emoji: '💬' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/advisor/documents', emoji: '📄' },
  { icon: Settings, label: 'Settings', path: '/dashboard/advisor/settings', emoji: '⚙️' },
];

export const AdvisorSidebar = () => {
  const pathname = usePathname();
  const { user } = useUserContext();

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return '??';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Advisor' : 'Advisor';
  const initials = user && user.first_name && user.last_name 
    ? getInitials(user.first_name, user.last_name) 
    : 'AD';

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" alt={fullName} />
            <AvatarFallback className="bg-ai text-ai-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{fullName}</h3>
            <p className="text-sm text-muted-foreground">{user?.role || 'Advisor'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard/advisor' && pathname?.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ai text-ai-foreground'
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


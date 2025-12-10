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
  { icon: Users, label: 'My Students', path: '/dashboard/advisor/students' },
  { icon: Brain, label: 'Evaluations & Reports', path: '/dashboard/advisor/evaluations' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/advisor/messages' },
  { icon: FileCheck, label: 'Documents', path: '/dashboard/advisor/documents' },
  { icon: Settings, label: 'Settings', path: '/dashboard/advisor/settings' },
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
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-6 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="w-14 h-14 border-2 border-[#4CAF50]">
            <AvatarImage src="/placeholder.svg" alt={fullName} />
            <AvatarFallback className="bg-[#4CAF50] text-white font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{fullName}</h3>
            <p className="text-xs text-gray-600">{user?.role || 'Advisor'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || 
                           (item.path !== '/dashboard/advisor' && pathname?.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all',
                    isActive
                      ? 'bg-[#4CAF50] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
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

